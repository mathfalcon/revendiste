import {Kysely} from 'kysely';
import {DB} from '@revendiste/shared';
import {BaseRepository} from '../base';

export class PayoutEventsRepository extends BaseRepository<PayoutEventsRepository> {
  withTransaction(trx: Kysely<DB>): PayoutEventsRepository {
    return new PayoutEventsRepository(trx);
  }

  async create(eventData: {
    payoutId: string;
    eventType:
      | 'payout_requested'
      | 'status_change'
      | 'admin_processed'
      | 'transfer_initiated'
      | 'transfer_completed'
      | 'transfer_failed'
      | 'cancelled';
    fromStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    toStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    eventData?: Record<string, unknown>;
    createdBy?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return await this.db
      .insertInto('payoutEvents')
      .values(eventData)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getByPayoutId(payoutId: string) {
    return await this.db
      .selectFrom('payoutEvents')
      .selectAll()
      .where('payoutId', '=', payoutId)
      .orderBy('createdAt', 'desc')
      .execute();
  }
}

