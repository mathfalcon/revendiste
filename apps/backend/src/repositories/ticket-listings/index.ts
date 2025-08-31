import {Kysely} from 'kysely';
import {DB, TicketListing} from '~/types';

export class TicketListingsRepository {
  constructor(private readonly db: Kysely<DB>) {}

  async createBatch(
    ticketListings: Pick<
      TicketListing,
      'publisherUserId' | 'eventId' | 'ticketWaveId' | 'price'
    >[],
  ) {
    if (ticketListings.length === 0) {
      return [];
    }

    return this.db
      .insertInto('ticketListings')
      .values(ticketListings)
      .returningAll()
      .execute();
  }
}
