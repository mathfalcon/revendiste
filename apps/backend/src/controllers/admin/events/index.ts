import express from 'express';
import {
  Route,
  Get,
  Put,
  Post,
  Delete,
  Tags,
  Middlewares,
  Request,
  Response,
  Path,
  Queries,
  UploadedFile,
  FormField,
} from '@mathfalcon/tsoa-runtime';
import {
  requireAuthMiddleware,
  requireAdminMiddleware,
  ensurePagination,
  paginationMiddleware,
} from '~/middleware';
import {EventsRepository, EventTicketWavesRepository} from '~/repositories';
import {db} from '~/db';
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  BadRequestError,
} from '~/errors';
import {ValidateBody, ValidateQuery, Body, Query} from '~/decorators';
import {
  AdminEventsQuery,
  AdminEventsRouteSchema,
  UpdateEventRouteBody,
  UpdateEventRouteSchema,
  CreateTicketWaveRouteBody,
  CreateTicketWaveRouteSchema,
  UpdateTicketWaveRouteBody,
  UpdateTicketWaveRouteSchema,
} from './validation';
import {AdminEventsService} from '~/services/admin-events';
import type {
  PaginatedAdminEventsResponse,
  AdminEventDetail,
  UpdatedEvent,
  DeletedEvent,
  CreatedTicketWave,
  UpdatedTicketWave,
  DeletedTicketWave,
  UploadEventImageResponse as UploadImageResponse,
  DeleteEventImageResponse as DeleteImageResponse,
} from './types';

type GetEventsResponse = Promise<PaginatedAdminEventsResponse>;
type GetEventDetailsResponse = Promise<AdminEventDetail>;
type UpdateEventResponse = Promise<UpdatedEvent>;
type DeleteEventResponse = Promise<DeletedEvent>;
type CreateTicketWaveResponse = Promise<CreatedTicketWave>;
type UpdateTicketWaveResponse = Promise<UpdatedTicketWave>;
type DeleteTicketWaveResponse = Promise<DeletedTicketWave>;
type UploadEventImageResponse = Promise<UploadImageResponse>;
type DeleteEventImageResponse = Promise<DeleteImageResponse>;

@Route('admin/events')
@Middlewares(requireAuthMiddleware, requireAdminMiddleware)
@Tags('Admin - Events')
export class AdminEventsController {
  private service = new AdminEventsService(
    new EventsRepository(db),
    new EventTicketWavesRepository(db),
    db,
  );

  // ============================================================================
  // Events
  // ============================================================================

  @Get('/')
  @ValidateQuery(AdminEventsRouteSchema)
  @Middlewares(paginationMiddleware(20, 100), ensurePagination)
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async getEvents(
    @Queries() query: AdminEventsQuery,
    @Request() request: express.Request,
  ): Promise<GetEventsResponse> {
    return this.service.getEvents(request.pagination!, {
      includePast: query.includePast,
      search: query.search,
      status: query.status,
    });
  }

  @Get('/{eventId}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Event not found')
  public async getEventDetails(
    @Path() eventId: string,
  ): Promise<GetEventDetailsResponse> {
    return this.service.getEventDetails(eventId);
  }

  @Put('/{eventId}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Event not found')
  @Response<ValidationError>(422, 'Validation failed')
  @ValidateBody(UpdateEventRouteSchema)
  public async updateEvent(
    @Path() eventId: string,
    @Body() body: UpdateEventRouteBody,
  ): Promise<UpdateEventResponse> {
    return this.service.updateEvent(eventId, body);
  }

  @Delete('/{eventId}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Event not found')
  public async deleteEvent(
    @Path() eventId: string,
  ): Promise<DeleteEventResponse> {
    return this.service.deleteEvent(eventId);
  }

  // ============================================================================
  // Ticket Waves
  // ============================================================================

  @Post('/{eventId}/ticket-waves')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Event not found')
  @Response<ValidationError>(422, 'Validation failed')
  @ValidateBody(CreateTicketWaveRouteSchema)
  public async createTicketWave(
    @Path() eventId: string,
    @Body() body: CreateTicketWaveRouteBody,
  ): Promise<CreateTicketWaveResponse> {
    return this.service.createTicketWave(eventId, body);
  }

  @Put('/{eventId}/ticket-waves/{waveId}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Ticket wave not found')
  @Response<ValidationError>(422, 'Validation failed')
  @ValidateBody(UpdateTicketWaveRouteSchema)
  public async updateTicketWave(
    @Path() eventId: string,
    @Path() waveId: string,
    @Body() body: UpdateTicketWaveRouteBody,
  ): Promise<UpdateTicketWaveResponse> {
    return this.service.updateTicketWave(eventId, waveId, body);
  }

  @Delete('/{eventId}/ticket-waves/{waveId}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Ticket wave not found')
  public async deleteTicketWave(
    @Path() eventId: string,
    @Path() waveId: string,
  ): Promise<DeleteTicketWaveResponse> {
    return this.service.deleteTicketWave(eventId, waveId);
  }

  // ============================================================================
  // Event Images
  // ============================================================================

  @Post('/{eventId}/images')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Event not found')
  @Response<BadRequestError>(400, 'No file uploaded or invalid file')
  @Response<ValidationError>(422, 'Invalid file type')
  public async uploadEventImage(
    @Path() eventId: string,
    @UploadedFile('file') file: Express.Multer.File,
    @FormField() imageType: 'flyer' | 'hero',
  ): Promise<UploadEventImageResponse> {
    return this.service.uploadEventImage(eventId, file, imageType);
  }

  @Delete('/{eventId}/images/{imageId}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Image not found')
  public async deleteEventImage(
    @Path() eventId: string,
    @Path() imageId: string,
  ): Promise<DeleteEventImageResponse> {
    return this.service.deleteEventImage(eventId, imageId);
  }
}
