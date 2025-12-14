import {Kysely} from 'kysely';
import {DB} from '~/shared';
import {BaseRepository} from '../base';

export class ListingTicketsRepository extends BaseRepository<ListingTicketsRepository> {
  withTransaction(trx: Kysely<DB>): ListingTicketsRepository {
    return new ListingTicketsRepository(trx);
  }

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

  /**
   * Get ticket by ID with listing and event information
   * Note: Document information now lives in ticket_documents table
   * Use TicketDocumentsRepository to fetch document data
   */
  async getTicketById(ticketId: string) {
    return await this.db
      .selectFrom('listingTickets')
      .innerJoin('listings', 'listingTickets.listingId', 'listings.id')
      .innerJoin(
        'eventTicketWaves',
        'listings.ticketWaveId',
        'eventTicketWaves.id',
      )
      .innerJoin('events', 'eventTicketWaves.eventId', 'events.id')
      .select([
        'listingTickets.id',
        'listingTickets.listingId',
        'listingTickets.ticketNumber',
        'listingTickets.price',
        'listingTickets.soldAt',
        'listings.publisherUserId',
        'eventTicketWaves.name as ticketWaveName',
        'eventTicketWaves.eventId',
        'events.name as eventName',
        'events.eventStartDate',
        'events.eventEndDate',
      ])
      .where('listingTickets.id', '=', ticketId)
      .where('listingTickets.deletedAt', 'is', null)
      .where('listingTickets.cancelledAt', 'is', null)
      .where('listings.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  /**
   * Get ticket for buyer verification
   * Used by buyers to verify ownership of purchased tickets
   */
  async getTicketByOrderId(orderId: string, ticketId: string) {
    return await this.db
      .selectFrom('listingTickets')
      .innerJoin(
        'orderTicketReservations',
        'listingTickets.id',
        'orderTicketReservations.listingTicketId',
      )
      .innerJoin('orders', 'orderTicketReservations.orderId', 'orders.id')
      .select([
        'listingTickets.id',
        'listingTickets.listingId',
        'listingTickets.ticketNumber',
        'orders.userId as buyerUserId',
        'orders.status as orderStatus',
      ])
      .where('orders.id', '=', orderId)
      .where('listingTickets.id', '=', ticketId)
      .where('orders.status', '=', 'confirmed')
      .where('orderTicketReservations.deletedAt', 'is', null)
      .executeTakeFirst();
  }
}
