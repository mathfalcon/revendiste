import express from 'express';
import {Route, Post, Tags, Middlewares, Request, Body} from '@tsoa/runtime';
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
  @Middlewares(requireAuthMiddleware)
  public async create(
    @Body() body: CreateTicketListingDto,
    @Request() request: express.Request,
  ): CreateTicketListingResponse {
    return this.service.createTicketListing({
      ...body,
      publisherUserId: request.user.id,
    });
  }
}
