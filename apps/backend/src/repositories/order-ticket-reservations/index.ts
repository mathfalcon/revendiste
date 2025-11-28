import {Kysely} from 'kysely';
import {jsonObjectFrom} from 'kysely/helpers/postgres';
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

  /**
   * Get tickets for an order with document status
   * Used by buyers to view their purchased tickets
   * Works for both pending (active reservations) and confirmed (soft-deleted reservations) orders
   */
  async getTicketsByOrderId(orderId: string) {
    return await this.db
      .selectFrom('orderTicketReservations')
      .innerJoin(
        'listingTickets',
        'orderTicketReservations.listingTicketId',
        'listingTickets.id',
      )
      .innerJoin('listings', 'listingTickets.listingId', 'listings.id')
      .innerJoin(
        'eventTicketWaves',
        'listings.ticketWaveId',
        'eventTicketWaves.id',
      )
      .innerJoin('orders', 'orderTicketReservations.orderId', 'orders.id')
      .leftJoin('ticketDocuments', join =>
        join
          .onRef('ticketDocuments.ticketId', '=', 'listingTickets.id')
          .on('ticketDocuments.isPrimary', '=', true)
          .on('ticketDocuments.deletedAt', 'is', null),
      )
      .select(eb => [
        'listingTickets.id',
        'listingTickets.price',
        'listingTickets.soldAt',
        'eventTicketWaves.name as ticketWaveName',
        jsonObjectFrom(
          eb
            .selectFrom('ticketDocuments')
            .select([
              'ticketDocuments.id',
              'ticketDocuments.status',
              'ticketDocuments.uploadedAt',
              'ticketDocuments.storagePath',
              'ticketDocuments.mimeType',
            ])
            .whereRef('ticketDocuments.ticketId', '=', 'listingTickets.id')
            .where('ticketDocuments.isPrimary', '=', true)
            .where('ticketDocuments.deletedAt', 'is', null),
        ).as('document'),
        // Note: document is intentionally nullable (ticket may not have document yet)
        // We don't use $notNull() here because documents are optional
      ])
      .where('orderTicketReservations.orderId', '=', orderId)
      // Include both active and soft-deleted reservations (for confirmed orders)
      // This allows us to find tickets even after order confirmation
      // We don't filter by deletedAt on reservations to include confirmed orders
      .where('listingTickets.deletedAt', 'is', null)
      .orderBy('listingTickets.ticketNumber', 'asc')
      .execute();
  }
}
