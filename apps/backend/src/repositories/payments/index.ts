import {type Kysely, type Insertable, type Updateable} from 'kysely';
import type {DB, Payments, Payment} from '~/types';
import {BaseRepository} from '../base';

export class PaymentsRepository extends BaseRepository<PaymentsRepository> {
  /**
   * Creates a transaction-aware instance of the repository
   */
  withTransaction(trx: Kysely<DB>): PaymentsRepository {
    return new PaymentsRepository(trx);
  }

  /**
   * Creates a new payment record
   */
  async create(payment: Insertable<Payments>) {
    return await this.db
      .insertInto('payments')
      .values(payment)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Finds a payment by ID
   */
  async getById(id: string) {
    return (
      (await this.db
        .selectFrom('payments')
        .selectAll()
        .where('id', '=', id)
        .where('deletedAt', 'is', null)
        .executeTakeFirst()) || null
    );
  }

  /**
   * Finds a payment by order ID
   */
  async getByOrderId(orderId: string) {
    return (
      (await this.db
        .selectFrom('payments')
        .selectAll()
        .where('orderId', '=', orderId)
        .where('deletedAt', 'is', null)
        .orderBy('createdAt', 'desc')
        .executeTakeFirst()) || null
    );
  }

  /**
   * Finds all payments for an order
   */
  async getAllByOrderId(orderId: string) {
    return await this.db
      .selectFrom('payments')
      .selectAll()
      .where('orderId', '=', orderId)
      .where('deletedAt', 'is', null)
      .orderBy('createdAt', 'desc')
      .execute();
  }

  /**
   * Finds a payment by provider and provider payment ID
   */
  async getByProviderPaymentId(provider: string, providerPaymentId: string) {
    return (
      (await this.db
        .selectFrom('payments')
        .selectAll()
        .where('provider', '=', provider as any)
        .where('providerPaymentId', '=', providerPaymentId)
        .where('deletedAt', 'is', null)
        .executeTakeFirst()) || null
    );
  }

  /**
   * Updates a payment record
   */
  async update(id: string, data: Updateable<Payments>) {
    return await this.db
      .updateTable('payments')
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Updates payment status with timestamp
   */
  async updateStatus(
    id: string,
    status:
      | 'pending'
      | 'processing'
      | 'paid'
      | 'failed'
      | 'cancelled'
      | 'expired'
      | 'refunded'
      | 'partially_refunded',
    metadata?: {
      approvedAt?: Date;
      failedAt?: Date;
      cancelledAt?: Date;
      expiredAt?: Date;
      refundedAt?: Date;
      failureReason?: string;
    },
  ) {
    return await this.db
      .updateTable('payments')
      .set({
        status,
        ...metadata,
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Soft deletes a payment
   */
  async softDelete(id: string) {
    await this.db
      .updateTable('payments')
      .set({deletedAt: new Date()})
      .where('id', '=', id)
      .execute();
  }
}
