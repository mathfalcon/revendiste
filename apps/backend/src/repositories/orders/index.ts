import {Kysely} from 'kysely';
import {jsonArrayFrom, jsonObjectFrom} from 'kysely/helpers/postgres';
import {DB} from '~/types';
import {BaseRepository} from '../base';

export class OrdersRepository extends BaseRepository<OrdersRepository> {
  withTransaction(trx: Kysely<DB>): OrdersRepository {
    return new OrdersRepository(trx);
  }

  async create(orderData: {
    userId: string;
    eventId: string;
    status: 'pending';
    totalAmount: number;
    subtotalAmount: number;
    platformCommission: number;
    vatOnCommission: number;
    currency: string;
    reservationExpiresAt: Date;
  }) {
    return await this.db
      .insertInto('orders')
      .values(orderData)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getByIdWithItems(orderId: string) {
    return await this.db
      .selectFrom('orders')
      .leftJoin('orderItems', 'orders.id', 'orderItems.orderId')
      .leftJoin(
        'eventTicketWaves',
        'orderItems.ticketWaveId',
        'eventTicketWaves.id',
      )
      .leftJoin('events', 'orders.eventId', 'events.id')
      .select(eb => [
        'orders.id',
        'orders.userId',
        'orders.eventId',
        'orders.status',
        'orders.totalAmount',
        'orders.subtotalAmount',
        'orders.platformCommission',
        'orders.vatOnCommission',
        'orders.currency',
        'orders.reservationExpiresAt',
        'orders.confirmedAt',
        'orders.cancelledAt',
        'orders.createdAt',
        'orders.updatedAt',
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
            ])
            .whereRef('events.id', '=', 'orders.eventId'),
        ).as('event'),
        jsonArrayFrom(
          eb
            .selectFrom('orderItems')
            .leftJoin(
              'eventTicketWaves',
              'orderItems.ticketWaveId',
              'eventTicketWaves.id',
            )
            .select([
              'orderItems.id',
              'orderItems.ticketWaveId',
              'orderItems.pricePerTicket',
              'orderItems.quantity',
              'orderItems.subtotal',
              'eventTicketWaves.name as ticketWaveName',
              'eventTicketWaves.currency',
            ])
            .whereRef('orderItems.orderId', '=', 'orders.id')
            .where('orderItems.deletedAt', 'is', null),
        ).as('items'),
      ])
      .where('orders.id', '=', orderId)
      .where('orders.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  async updateStatus(
    orderId: string,
    status: 'confirmed' | 'cancelled' | 'expired',
    additionalData?: {
      confirmedAt?: Date;
      cancelledAt?: Date;
    },
  ) {
    const updateData: any = {status};
    if (additionalData?.confirmedAt)
      updateData.confirmedAt = additionalData.confirmedAt;
    if (additionalData?.cancelledAt)
      updateData.cancelledAt = additionalData.cancelledAt;

    return await this.db
      .updateTable('orders')
      .set(updateData)
      .where('id', '=', orderId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getExpiredOrders() {
    return await this.db
      .selectFrom('orders')
      .selectAll()
      .where('status', '=', 'pending')
      .where('reservationExpiresAt', '<', new Date())
      .where('deletedAt', 'is', null)
      .execute();
  }
}
