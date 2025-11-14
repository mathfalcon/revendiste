import {Kysely} from 'kysely';
import {jsonArrayFrom, jsonObjectFrom} from 'kysely/helpers/postgres';
import {CreateTicketListingRouteBody} from '~/controllers/ticket-listings/validation';
import {ValidationError} from '~/errors';
import {DB} from '~/types';

export class TicketListingsRepository {
  constructor(private readonly db: Kysely<DB>) {}

  async createBatch(
    ticketListings: CreateTicketListingRouteBody & {publisherUserId: string},
  ) {
    if (ticketListings.quantity === 0) {
      throw new ValidationError('Quantity must be greater than 0');
    }

    return this.db.transaction().execute(async tx => {
      const listing = await tx
        .insertInto('listings')
        .values({
          publisherUserId: ticketListings.publisherUserId,
          ticketWaveId: ticketListings.ticketWaveId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      const createdListingTickets = await tx
        .insertInto('listingTickets')
        .values(
          Array.from({length: ticketListings.quantity}, (_, i) => ({
            listingId: listing.id,
            ticketNumber: i + 1,
            price: ticketListings.price,
          })),
        )
        .returningAll()
        .execute();

      return {
        ...listing,
        listingTickets: createdListingTickets,
      };
    });
  }

  async getListingsWithTicketsByUserId(userId: string) {
    return await this.db
      .selectFrom('listings')
      .innerJoin(
        'eventTicketWaves',
        'listings.ticketWaveId',
        'eventTicketWaves.id',
      )
      .innerJoin('events', 'eventTicketWaves.eventId', 'events.id')
      .select(eb => [
        'listings.id',
        'listings.soldAt',
        'listings.createdAt',
        'listings.updatedAt',
        jsonObjectFrom(
          eb
            .selectFrom('eventTicketWaves')
            .select([
              'eventTicketWaves.id',
              'eventTicketWaves.name',
              'eventTicketWaves.currency',
            ])
            .whereRef('eventTicketWaves.id', '=', 'listings.ticketWaveId'),
        )
          .$notNull()
          .as('ticketWave'),
        jsonObjectFrom(
          eb
            .selectFrom('events')
            .select([
              'events.id',
              'events.name',
              'events.eventStartDate',
              'events.eventEndDate',
              'events.venueName',
              'events.venueAddress',
              'events.description',
            ])
            .whereRef('events.id', '=', 'eventTicketWaves.eventId'),
        )
          .$notNull()
          .as('event'),
        jsonArrayFrom(
          eb
            .selectFrom('listingTickets')
            .select([
              'listingTickets.id',
              'listingTickets.ticketNumber',
              'listingTickets.price',
              'listingTickets.soldAt',
              'listingTickets.cancelledAt',
              'listingTickets.createdAt',
              'listingTickets.updatedAt',
            ])
            .whereRef('listingTickets.listingId', '=', 'listings.id')
            .where('listingTickets.deletedAt', 'is', null)
            .orderBy('listingTickets.ticketNumber', 'asc'),
        )
          .$notNull()
          .as('tickets'),
      ])
      .where('listings.publisherUserId', '=', userId)
      .where('listings.deletedAt', 'is', null)
      .orderBy('listings.createdAt', 'desc')
      .execute();
  }

  async markListingAsSold(listingId: string) {
    return await this.db
      .updateTable('listings')
      .set({
        soldAt: new Date(),
      })
      .where('id', '=', listingId)
      .returningAll()
      .executeTakeFirst();
  }

  async checkAndMarkListingsAsSold(listingIds: string[]) {
    // For each listing, check if all tickets are sold
    const results = [];

    for (const listingId of listingIds) {
      const tickets = await this.db
        .selectFrom('listingTickets')
        .select(['id', 'soldAt'])
        .where('listingId', '=', listingId)
        .where('deletedAt', 'is', null)
        .where('cancelledAt', 'is', null)
        .execute();

      // Check if all tickets are sold
      const allTicketsSold = tickets.every(ticket => ticket.soldAt !== null);

      if (allTicketsSold && tickets.length > 0) {
        const result = await this.markListingAsSold(listingId);
        results.push(result);
      }
    }

    return results;
  }
}
