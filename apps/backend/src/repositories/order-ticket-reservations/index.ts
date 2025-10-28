import {Kysely} from 'kysely';
import {DB} from '~/types';
import {BaseRepository} from '../base';

export class OrderTicketReservationsRepository extends BaseRepository<OrderTicketReservationsRepository> {
  withTransaction(trx: Kysely<DB>): OrderTicketReservationsRepository {
    return new OrderTicketReservationsRepository(trx);
  }

  async createBatch(
    reservations: Array<{
      orderId: string;
      listingTicketId: string;
      reservedUntil: Date;
    }>,
  ) {
    return await this.db
      .insertInto('orderTicketReservations')
      .values(reservations)
      .returningAll()
      .execute();
  }

  async createReservations(
    orderId: string,
    ticketIds: string[],
    reservedUntil: Date,
  ) {
    const reservations = ticketIds.map(ticketId => ({
      orderId,
      listingTicketId: ticketId,
      reservedUntil,
    }));

    return await this.createBatch(reservations);
  }

  async getByOrderId(orderId: string) {
    return await this.db
      .selectFrom('orderTicketReservations')
      .leftJoin(
        'listingTickets',
        'orderTicketReservations.listingTicketId',
        'listingTickets.id',
      )
      .select([
        'orderTicketReservations.id',
        'orderTicketReservations.orderId',
        'orderTicketReservations.listingTicketId',
        'orderTicketReservations.reservedAt',
        'orderTicketReservations.reservedUntil',
        'listingTickets.ticketNumber',
        'listingTickets.price',
      ])
      .where('orderTicketReservations.orderId', '=', orderId)
      .where('orderTicketReservations.deletedAt', 'is', null)
      .execute();
  }

  async releaseByOrderId(orderId: string) {
    return await this.db
      .updateTable('orderTicketReservations')
      .set({
        deletedAt: new Date(),
      })
      .where('orderId', '=', orderId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .execute();
  }

  async getExpiredReservations() {
    return await this.db
      .selectFrom('orderTicketReservations')
      .selectAll()
      .where('reservedUntil', '<', new Date())
      .where('deletedAt', 'is', null)
      .execute();
  }

  async cleanupExpiredReservations() {
    return await this.db
      .updateTable('orderTicketReservations')
      .set({
        deletedAt: new Date(),
      })
      .where('reservedUntil', '<', new Date())
      .where('deletedAt', 'is', null)
      .returningAll()
      .execute();
  }

  async confirmOrderReservations(orderId: string) {
    // Mark reservations as deleted (they're now confirmed)
    return await this.db
      .updateTable('orderTicketReservations')
      .set({
        deletedAt: new Date(),
      })
      .where('orderId', '=', orderId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .execute();
  }
}
