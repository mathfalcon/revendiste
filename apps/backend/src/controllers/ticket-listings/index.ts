import express from 'express';
import {
  Route,
  Post,
  Put,
  Delete,
  Get,
  Tags,
  Middlewares,
  Request,
  Response,
  Path,
  UploadedFile,
  UploadedFiles,
  FormField,
} from '@mathfalcon/tsoa-runtime';
import {TicketListingsService} from '~/services/ticket-listings';
import {TicketDocumentService} from '~/services/ticket-documents';
import {NotificationService} from '~/services/notifications';
import {
  requireAuthMiddleware,
  paginationMiddleware,
  ensurePagination,
} from '~/middleware';
import {
  TicketListingsRepository,
  EventsRepository,
  EventTicketWavesRepository,
  ListingTicketsRepository,
  OrdersRepository,
  UsersRepository,
  NotificationsRepository,
  NotificationBatchesRepository,
  TicketDocumentsRepository,
  OrderTicketReservationsRepository,
} from '~/repositories';
import {db} from '~/db';
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  BadRequestError,
} from '~/errors';
import {VALIDATION_MESSAGES} from '~/constants/error-messages';
import {
  CreateTicketListingRouteSchema,
  UpdateTicketPriceRouteBody,
  UpdateTicketPriceRouteSchema,
} from './validation';
import {Body, ValidateBody} from '~/decorators';
import {TICKET_LISTING_ERROR_MESSAGES} from '~/constants/error-messages';
import {getPostHog} from '~/lib/posthog';

type CreateTicketListingResponse = Awaited<ReturnType<
  TicketListingsService['createTicketListing']
>>;

type GetUserListingsResponse = Awaited<ReturnType<
  TicketListingsService['getUserListingsWithTickets']
>>;

type GetMyListingByIdResponse = Awaited<
  ReturnType<TicketListingsService['getUserListingWithTicketsById']>
>;

type UploadDocumentResponse = Awaited<
  ReturnType<TicketDocumentService['uploadTicketDocument']>
>;

type UpdateTicketPriceResponse = Awaited<ReturnType<
  TicketListingsService['updateTicketPrice']
>>;

type RemoveTicketResponse = Awaited<ReturnType<TicketListingsService['removeTicket']>>;

type GetTicketInfoResponse = Awaited<ReturnType<TicketDocumentService['getTicketInfo']>>;

// Create shared repositories
const ticketListingsRepository = new TicketListingsRepository(db);
const eventsRepository = new EventsRepository(db);
const eventTicketWavesRepository = new EventTicketWavesRepository(db);
const listingTicketsRepository = new ListingTicketsRepository(db);
const ordersRepository = new OrdersRepository(db);
const usersRepository = new UsersRepository(db);
const notificationsRepository = new NotificationsRepository(db);
const ticketDocumentsRepository = new TicketDocumentsRepository(db);
const orderTicketReservationsRepository = new OrderTicketReservationsRepository(
  db,
);
const notificationBatchesRepository = new NotificationBatchesRepository(db);

// Create shared services
const notificationService = new NotificationService(
  notificationsRepository,
  usersRepository,
  notificationBatchesRepository,
);

@Route('ticket-listings')
@Tags('Ticket Listings')
export class TicketListingsController {
  private service = new TicketListingsService(
    ticketListingsRepository,
    eventsRepository,
    eventTicketWavesRepository,
    listingTicketsRepository,
    ordersRepository,
    usersRepository,
    notificationService,
    new TicketDocumentService(
      listingTicketsRepository,
      ticketDocumentsRepository,
      orderTicketReservationsRepository,
      ordersRepository,
      notificationService,
    ),
  );
  private documentService = new TicketDocumentService(
    listingTicketsRepository,
    ticketDocumentsRepository,
    orderTicketReservationsRepository,
    ordersRepository,
    notificationService,
  );

  @Post('/')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<BadRequestError>(
    400,
    'Invalid request body, missing required fields, or invalid data types',
  )
  @Response<NotFoundError>(404, 'Event not found or ticket wave not found')
  @Response<ValidationError>(
    422,
    'Validation failed: Cannot create listing for finished event, ticket wave does not belong to event, price exceeds face value, quantity must be greater than 0, or ticket limit exceeded',
  )
  @Middlewares(requireAuthMiddleware)
  public async create(
    @FormField() eventId: string,
    @FormField() ticketWaveId: string,
    @FormField() price: number,
    @FormField() quantity: number,
    @Request() request: express.Request,
    @UploadedFiles('documents') documents?: Express.Multer.File[],
  ): Promise<CreateTicketListingResponse> {
    // Validate form fields using the Zod schema (FormField sends strings)
    const parsed = CreateTicketListingRouteSchema.safeParse({
      body: {
        eventId,
        ticketWaveId,
        price: Number(price),
        quantity: Number(quantity),
      },
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      throw new BadRequestError(firstError?.message ?? 'Datos inválidos');
    }

    const body = parsed.data.body;
    const documentFiles = documents?.map(f => ({
      buffer: f.buffer,
      originalName: f.originalname,
      mimeType: f.mimetype,
      sizeBytes: f.size,
    }));

    const result = await this.service.createTicketListing(
      body,
      request.user.id,
      documentFiles,
    );
    getPostHog()?.capture({
      distinctId: request.user.id,
      event: 'ticket_listing_created',
      properties: {
        event_id: body.eventId,
        ticket_wave_id: body.ticketWaveId,
        quantity: body.quantity,
        price: body.price,
        has_documents: !!documents?.length,
      },
    });
    return result;
  }

  @Get('/my-listings')
  @Middlewares(
    requireAuthMiddleware,
    paginationMiddleware(10, 100),
    ensurePagination,
  )
  @Response<UnauthorizedError>(401, 'Authentication required')
  public async getMyListings(
    @Request() request: express.Request,
  ): Promise<GetUserListingsResponse> {
    return this.service.getUserListingsWithTickets(
      request.user.id,
      request.pagination!,
    );
  }

  @Get('/my-listings/{listingId}')
  @Middlewares(requireAuthMiddleware)
  @Response<NotFoundError>(404, 'Listing not found')
  @Response<UnauthorizedError>(401, 'Authentication required')
  public async getMyListingById(
    @Request() request: express.Request,
    @Path() listingId: string,
  ): Promise<GetMyListingByIdResponse> {
    return this.service.getUserListingWithTicketsById(
      request.user.id,
      listingId,
    );
  }

  /**
   * Upload a ticket document
   *
   * Sellers can upload PDF/image documents for their sold tickets.
   * Documents must be uploaded before the event ends.
   *
   * @param ticketId - ID of the ticket
   * @param file - Document file (PDF, PNG, JPG, JPEG - max 10MB)
   */
  @Post('/tickets/{ticketId}/document')
  @Response<UnauthorizedError>(
    401,
    'Authentication required or not authorized to upload for this ticket',
  )
  @Response<NotFoundError>(404, 'Ticket not found')
  @Response<BadRequestError>(400, 'No file uploaded or invalid file')
  @Response<ValidationError>(
    422,
    'Validation failed: ticket not sold, event has ended, invalid file type, or file too large',
  )
  @Middlewares(requireAuthMiddleware)
  public async uploadDocument(
    @Path() ticketId: string,
    @UploadedFile('file') file: Express.Multer.File,
    @Request() request: express.Request,
  ): Promise<UploadDocumentResponse> {
    if (!file) {
      throw new BadRequestError(VALIDATION_MESSAGES.NO_FILE_UPLOADED);
    }

    const result = await this.documentService.uploadTicketDocument(
      ticketId,
      request.user.id,
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    );
    getPostHog()?.capture({
      distinctId: request.user.id,
      event: 'ticket_document_uploaded',
      properties: {
        ticket_id: ticketId,
        file_type: file.mimetype,
        file_size_bytes: file.size,
      },
    });
    return result;
  }

  /**
   * Update/replace a ticket document
   *
   * Uploads a new version of the document. Previous versions are kept for audit trail.
   * Can only update before the event ends.
   *
   * @param ticketId - ID of the ticket
   * @param file - New document file (PDF, PNG, JPG, JPEG - max 10MB)
   */
  @Put('/tickets/{ticketId}/document')
  @Response<UnauthorizedError>(
    401,
    'Authentication required or not authorized to upload for this ticket',
  )
  @Response<NotFoundError>(404, 'Ticket not found')
  @Response<BadRequestError>(400, 'No file uploaded or invalid file')
  @Response<ValidationError>(
    422,
    'Validation failed: ticket not sold, event has ended, invalid file type, or file too large',
  )
  @Middlewares(requireAuthMiddleware)
  public async updateDocument(
    @Path() ticketId: string,
    @UploadedFile('file') file: Express.Multer.File,
    @Request() request: express.Request,
  ): Promise<UploadDocumentResponse> {
    if (!file) {
      throw new BadRequestError(VALIDATION_MESSAGES.NO_FILE_UPLOADED);
    }

    // Uses the same service method - it handles versioning automatically
    const result = await this.documentService.uploadTicketDocument(
      ticketId,
      request.user.id,
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    );
    getPostHog()?.capture({
      distinctId: request.user.id,
      event: 'ticket_document_uploaded',
      properties: {
        ticket_id: ticketId,
        file_type: file.mimetype,
        file_size_bytes: file.size,
        is_update: true,
      },
    });
    return result;
  }

  /**
   * Update ticket price
   *
   * Only active tickets (not reserved, sold, or cancelled) can have their price updated.
   * Price cannot exceed the ticket wave face value.
   *
   * @param ticketId - ID of the ticket
   * @param body - Request body containing the new price
   */
  @Put('/tickets/{ticketId}/price')
  @Response<UnauthorizedError>(
    401,
    'Authentication required or not authorized to modify this ticket',
  )
  @Response<NotFoundError>(404, 'Ticket not found')
  @Response<ValidationError>(
    422,
    'Validation failed: ticket not active, event has ended, or price exceeds face value',
  )
  @Middlewares(requireAuthMiddleware)
  @ValidateBody(UpdateTicketPriceRouteSchema)
  public async updateTicketPrice(
    @Path() ticketId: string,
    @Body() body: UpdateTicketPriceRouteBody,
    @Request() request: express.Request,
  ): Promise<UpdateTicketPriceResponse> {
    const result = await this.service.updateTicketPrice(
      ticketId,
      body.price,
      request.user.id,
    );
    getPostHog()?.capture({
      distinctId: request.user.id,
      event: 'ticket_price_updated',
      properties: {
        ticket_id: ticketId,
        new_price: body.price,
      },
    });
    return result;
  }

  /**
   * Remove a ticket from listing
   *
   * Only active tickets (not reserved, sold, or cancelled) can be removed.
   * This performs a soft delete (sets deletedAt timestamp).
   *
   * @param ticketId - ID of the ticket to remove
   */
  @Delete('/tickets/{ticketId}')
  @Response<UnauthorizedError>(
    401,
    'Authentication required or not authorized to modify this ticket',
  )
  @Response<NotFoundError>(404, 'Ticket not found')
  @Response<ValidationError>(
    422,
    'Validation failed: ticket not active or event has ended',
  )
  @Middlewares(requireAuthMiddleware)
  public async removeTicket(
    @Path() ticketId: string,
    @Request() request: express.Request,
  ): Promise<RemoveTicketResponse> {
    const result = await this.service.removeTicket(ticketId, request.user.id);
    getPostHog()?.capture({
      distinctId: request.user.id,
      event: 'ticket_removed',
      properties: {
        ticket_id: ticketId,
      },
    });
    return result;
  }

  /**
   * Get ticket information with document details
   *
   * Returns ticket info including document URL for viewing.
   * Only the seller (ticket publisher) can access this endpoint.
   *
   * @param ticketId - ID of the ticket
   */
  @Get('/tickets/{ticketId}/info')
  @Response<UnauthorizedError>(
    401,
    'Authentication required or not authorized to view this ticket',
  )
  @Response<NotFoundError>(404, 'Ticket not found')
  @Middlewares(requireAuthMiddleware)
  public async getTicketInfo(
    @Path() ticketId: string,
    @Request() request: express.Request,
  ): Promise<GetTicketInfoResponse> {
    return this.documentService.getTicketInfo(ticketId, request.user.id);
  }
}
