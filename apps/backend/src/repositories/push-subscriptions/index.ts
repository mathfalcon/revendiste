import {type Kysely} from 'kysely';
import type {DB} from '@revendiste/shared';
import {BaseRepository} from '../base';

export class PushSubscriptionsRepository extends BaseRepository<PushSubscriptionsRepository> {
  withTransaction(trx: Kysely<DB>): PushSubscriptionsRepository {
    return new PushSubscriptionsRepository(trx);
  }

  /** Upsert a push subscription — ON CONFLICT(endpoint) updates keys and user agent */
  async upsert(data: {
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent?: string;
  }) {
    return await this.db
      .insertInto('pushSubscriptions')
      .values({
        userId: data.userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        userAgent: data.userAgent ?? null,
      })
      .onConflict(oc =>
        oc.column('endpoint').doUpdateSet({
          userId: data.userId,
          p256dh: data.p256dh,
          auth: data.auth,
          userAgent: data.userAgent ?? null,
          updatedAt: new Date(),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /** Get all push subscriptions for a user */
  async getByUserId(userId: string) {
    return await this.db
      .selectFrom('pushSubscriptions')
      .selectAll()
      .where('userId', '=', userId)
      .execute();
  }

  /** Delete a specific subscription by user and endpoint */
  async deleteByUserIdAndEndpoint(userId: string, endpoint: string) {
    return await this.db
      .deleteFrom('pushSubscriptions')
      .where('userId', '=', userId)
      .where('endpoint', '=', endpoint)
      .execute();
  }

  /** Bulk delete stale subscriptions by their endpoints (410 Gone) */
  async deleteByEndpoints(endpoints: string[]) {
    if (endpoints.length === 0) return;
    await this.db
      .deleteFrom('pushSubscriptions')
      .where('endpoint', 'in', endpoints)
      .execute();
  }
}
