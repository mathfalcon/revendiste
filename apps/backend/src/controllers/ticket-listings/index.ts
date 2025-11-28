import express from 'express';
import {
  Route,
  Post,
  Put,
  Get,
  Tags,
  Middlewares,
  Request,
  Response,
  Path,
  UploadedFile,
} from '@tsoa/runtime';
import {TicketListingsService} from '~/services/ticket-listings';
import {TicketDocumentService} from '~/services/ticket-documents';
import {requireAuthMiddleware} from '~/middleware';
import {
  TicketListingsRepository,
  EventsRepository,
  EventTicketWavesRepository,
} from '~/repositories';
import {db} from '~/db';
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  BadRequestError,
} from '~/errors';
import {
  CreateTicketListingRouteBody,
  CreateTicketListingRouteSchema,
} from './validation';
import {Body, ValidateBody} from '~/decorators';

type CreateTicketListingResponse = ReturnType<
  TicketListingsService['createTicketListing']
>;

type GetUserListingsResponse = ReturnType<
  TicketListingsService['getUserListingsWithTickets']
>;

type UploadDocumentResponse = Awaited<
  ReturnType<TicketDocumentService['uploadTicketDocument']>
>;

@Route('ticket-listings')
@Tags('Ticket Listings')
export class TicketListingsController {
  private service = new TicketListingsService(
    new TicketListingsRepository(db),
    new EventsRepository(db),
    new EventTicketWavesRepository(db),
  );
  private documentService = new TicketDocumentService(db);

  @Post('/')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<BadRequestError>(
    400,
    'Invalid request body, missing required fields, or invalid data types',
  )
  @Response<NotFoundError>(404, 'Event not found or ticket wave not found')
  @Response<ValidationError>(
    422,
    'Validation failed: Cannot create listing for finished event, ticket wave does not belong to event, price exceeds face value, or quantity must be greater than 0',
  )
  @Middlewares(requireAuthMiddleware)
  @ValidateBody(CreateTicketListingRouteSchema)
  public async create(
    @Body() body: CreateTicketListingRouteBody,
    @Request() request: express.Request,
  ): Promise<CreateTicketListingResponse> {
    return this.service.createTicketListing(
      {
        ...body,
      },
      request.user.id,
    );
  }

  @Get('/my-listings')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Middlewares(requireAuthMiddleware)
  public async getMyListings(
    @Request() request: express.Request,
  ): Promise<GetUserListingsResponse> {
    return this.service.getUserListingsWithTickets(request.user.id);
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
      throw new BadRequestError('No file uploaded');
    }

    return this.documentService.uploadTicketDocument(
      ticketId,
      request.user.id,
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    );
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
      throw new BadRequestError('No file uploaded');
    }

    // Uses the same service method - it handles versioning automatically
    return this.documentService.uploadTicketDocument(
      ticketId,
      request.user.id,
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    );
  }
}
