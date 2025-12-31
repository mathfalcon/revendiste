import {type Kysely, type Insertable} from 'kysely';
import type {DB, PaymentEvents, PaymentEventType} from '@revendiste/shared';
import type {PaymentEvent} from '~/types/models';
import {BaseRepository} from '../base';

export class PaymentEventsRepository extends BaseRepository<PaymentEventsRepository> {
  /**
   * Creates a transaction-aware instance of the repository
   */
  withTransaction(trx: Kysely<DB>): PaymentEventsRepository {
    return new PaymentEventsRepository(trx);
  }

  /**
   * Creates a new payment event (immutable)
   */
  async create(event: Insertable<PaymentEvents>) {
    return await this.db
      .insertInto('paymentEvents')
      .values(event)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Gets all events for a payment
   */
  async getByPaymentId(paymentId: string) {
    return await this.db
      .selectFrom('paymentEvents')
      .selectAll()
      .where('paymentId', '=', paymentId)
      .orderBy('createdAt', 'asc')
      .execute();
  }

  /**
   * Gets the latest event for a payment
   */
  async getLatestByPaymentId(paymentId: string) {
    return (
      (await this.db
        .selectFrom('paymentEvents')
        .selectAll()
        .where('paymentId', '=', paymentId)
        .orderBy('createdAt', 'desc')
        .executeTakeFirst()) || null
    );
  }

  /**
   * Logs a status change event
   */
  async logStatusChange(
    paymentId: string,
    fromStatus: string | null,
    toStatus: string,
    eventData?: Record<string, any>,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    },
  ) {
    return await this.create({
      paymentId,
      eventType: 'status_change' as PaymentEventType,
      fromStatus: fromStatus as any,
      toStatus: toStatus as any,
      eventData: eventData ? JSON.stringify(eventData) : undefined,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Logs a webhook received event
   */
  async logWebhookReceived(
    paymentId: string,
    webhookPayload: Record<string, any>,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    },
  ) {
    return await this.create({
      paymentId,
      eventType: 'webhook_received' as PaymentEventType,
      fromStatus: null,
      toStatus: null,
      eventData: JSON.stringify(webhookPayload),
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  async logStatusSynced(
    paymentId: string,
    providerResponse: Record<string, any>,
  ) {
    return await this.create({
      paymentId,
      eventType: 'status_synced',
      fromStatus: null,
      toStatus: null,
      eventData: JSON.stringify(providerResponse),
      ipAddress: null,
      userAgent: null,
    });
  }

  /**
   * Logs a refund initiated event
   */
  async logRefundInitiated(
    paymentId: string,
    refundData: Record<string, any>,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    },
  ) {
    return await this.create({
      paymentId,
      eventType: 'refund_initiated' as PaymentEventType,
      fromStatus: null,
      toStatus: null,
      eventData: JSON.stringify(refundData),
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Logs a refund completed event
   */
  async logRefundCompleted(
    paymentId: string,
    refundData: Record<string, any>,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    },
  ) {
    return await this.create({
      paymentId,
      eventType: 'refund_completed' as PaymentEventType,
      fromStatus: null,
      toStatus: null,
      eventData: JSON.stringify(refundData),
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }
}
