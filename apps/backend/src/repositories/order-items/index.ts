import {Kysely} from 'kysely';
import {DB} from '~/types';
import {BaseRepository} from '../base';

export class OrderItemsRepository extends BaseRepository<OrderItemsRepository> {
  withTransaction(trx: Kysely<DB>): OrderItemsRepository {
    return new OrderItemsRepository(trx);
  }

  async createBatch(
    orderItems: Array<{
      orderId: string;
      ticketWaveId: string;
      pricePerTicket: number;
      quantity: number;
      subtotal: number;
    }>,
  ) {
    return await this.db
      .insertInto('orderItems')
      .values(orderItems)
      .returningAll()
      .execute();
  }

  async getByOrderId(orderId: string) {
    return await this.db
      .selectFrom('orderItems')
      .leftJoin(
        'eventTicketWaves',
        'orderItems.ticketWaveId',
        'eventTicketWaves.id',
      )
      .select([
        'orderItems.id',
        'orderItems.orderId',
        'orderItems.ticketWaveId',
        'orderItems.pricePerTicket',
        'orderItems.quantity',
        'orderItems.subtotal',
        'eventTicketWaves.name as ticketWaveName',
        'eventTicketWaves.currency',
      ])
      .where('orderItems.orderId', '=', orderId)
      .where('orderItems.deletedAt', 'is', null)
      .execute();
  }

  async deleteByOrderId(orderId: string) {
    return await this.db
      .updateTable('orderItems')
      .set({
        deletedAt: new Date(),
      })
      .where('orderId', '=', orderId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .execute();
  }
}
