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

  async cleanupExpiredReservationsForTickets(ticketIds: string[]) {
    // Soft-delete expired reservations for specific tickets
    // Used on-demand when creating new reservations to ensure expired ones don't block
    const now = new Date();
    return await this.db
      .updateTable('orderTicketReservations')
      .set({deletedAt: now})
      .where('listingTicketId', 'in', ticketIds)
      .where('deletedAt', 'is', null)
      .where('reservedUntil', '<', now)
      .returningAll()
      .execute();
  }

  async extendReservationsByOrderId(orderId: string, newReservedUntil: Date) {
    return await this.db
      .updateTable('orderTicketReservations')
      .set({
        reservedUntil: newReservedUntil,
        updatedAt: new Date(),
      })
      .where('orderId', '=', orderId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .execute();
  }
}
