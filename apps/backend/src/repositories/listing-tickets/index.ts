import {Kysely} from 'kysely';
import {DB} from '~/types';

export class ListingTicketsRepository {
  constructor(private readonly db: Kysely<DB>) {}

  async findAvailableTicketsByPriceGroup(
    ticketWaveId: string,
    price: number,
    quantity: number,
  ) {
    return await this.db
      .selectFrom('listingTickets')
      .innerJoin('listings', 'listingTickets.listingId', 'listings.id')
      .leftJoin('orderTicketReservations', join =>
        join
          .onRef(
            'orderTicketReservations.listingTicketId',
            '=',
            'listingTickets.id',
          )
          .on('orderTicketReservations.deletedAt', 'is', null)
          .on('orderTicketReservations.reservedUntil', '>', new Date()),
      )
      .select([
        'listingTickets.id',
        'listingTickets.listingId',
        'listingTickets.ticketNumber',
        'listingTickets.price',
      ])
      .where('listings.ticketWaveId', '=', ticketWaveId)
      .where('listingTickets.price', '=', price.toString())
      .where('listingTickets.soldAt', 'is', null)
      .where('listingTickets.cancelledAt', 'is', null)
      .where('listingTickets.deletedAt', 'is', null)
      .where('listings.deletedAt', 'is', null)
      .where('orderTicketReservations.id', 'is', null) // Not reserved
      .orderBy('listingTickets.createdAt', 'asc')
      .limit(quantity)
      .execute();
  }

  async markTicketsAsSold(ticketIds: string[]) {
    return await this.db
      .updateTable('listingTickets')
      .set({
        soldAt: new Date(),
      })
      .where('id', 'in', ticketIds)
      .returningAll()
      .execute();
  }

  async markTicketsAsSoldByOrderId(orderId: string) {
    return await this.db
      .updateTable('listingTickets')
      .set({
        soldAt: new Date(),
      })
      .where('id', 'in', eb =>
        eb
          .selectFrom('orderTicketReservations')
          .select('listingTicketId')
          .where('orderId', '=', orderId)
          .where('deletedAt', 'is', null),
      )
      .returningAll()
      .execute();
  }

  async getListingsByIds(listingIds: string[]) {
    return await this.db
      .selectFrom('listings')
      .select(['id', 'publisherUserId'])
      .where('id', 'in', listingIds)
      .where('deletedAt', 'is', null)
      .execute();
  }
}
