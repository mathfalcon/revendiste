import express from 'express';
import {
  Route,
  Post,
  Tags,
  Middlewares,
  Request,
  Body,
  Response,
} from '@tsoa/runtime';
import {
  TicketListingsService,
  CreateTicketListingDto,
} from '~/services/ticket-listings';
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

type CreateTicketListingResponse = Promise<
  ReturnType<TicketListingsService['createTicketListing']>
>;

@Route('ticket-listings')
@Tags('Ticket Listings')
export class TicketListingsController {
  private service = new TicketListingsService(
    new TicketListingsRepository(db),
    new EventsRepository(db),
    new EventTicketWavesRepository(db),
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
    'Validation failed: Cannot create listing for finished event, ticket wave does not belong to event, price exceeds face value, or quantity must be greater than 0',
  )
  @Middlewares(requireAuthMiddleware)
  public async create(
    @Body() body: CreateTicketListingDto,
    @Request() request: express.Request,
  ): CreateTicketListingResponse {
    return this.service.createTicketListing(
      {
        ...body,
      },
      request.user.id,
    );
  }
}
