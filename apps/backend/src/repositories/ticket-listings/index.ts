import {Kysely} from 'kysely';
import {CreateTicketListingRouteBody} from '~/controllers/ticket-listings/validation';
import {DB, Listings} from '~/types';

export class TicketListingsRepository {
  constructor(private readonly db: Kysely<DB>) {}

  async createBatch(
    ticketListings: CreateTicketListingRouteBody & {publisherUserId: string},
  ) {
    if (ticketListings.quantity === 0) {
      return {} as Listings;
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
}
