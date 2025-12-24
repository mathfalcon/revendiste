import {Kysely, sql} from 'kysely';
import {DB} from '@revendiste/shared';
import {BaseRepository} from '../base';
import {mapToPaginatedResponse} from '~/middleware';
import type {
  NotificationChannel,
  NotificationMetadata,
  NotificationType,
} from '@revendiste/shared';
import type {PaginationOptions} from '~/types/pagination';

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  channels: ('in_app' | 'email' | 'sms')[];
  actions?: Array<{
    type: string;
    label: string;
    url?: string;
    data?: Record<string, unknown>;
  }>;
  metadata?: NotificationMetadata;
}

const channelsAsJsonb = sql<NotificationChannel[]>`to_jsonb(channels)`.as(
  'channels',
);

export class NotificationsRepository extends BaseRepository<NotificationsRepository> {
  withTransaction(trx: Kysely<DB>): NotificationsRepository {
    return new NotificationsRepository(trx);
  }

  async create(data: CreateNotificationData) {
    return await this.db
      .insertInto('notifications')
      .values({
        userId: data.userId,
        type: data.type,
        channels: data.channels,
        actions: data.actions ? JSON.stringify(data.actions) : undefined,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
        status: 'pending',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getById(notificationId: string) {
    return await this.db
      .selectFrom('notifications')
      .selectAll()
      .select([channelsAsJsonb])
      .where('id', '=', notificationId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  async getByUserId(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      includeSeen?: boolean;
    },
  ) {
    let query = this.db
      .selectFrom('notifications')
      .selectAll()
      .where('userId', '=', userId)
      .where('deletedAt', 'is', null);

    if (options?.includeSeen === false) {
      query = query.where('seenAt', 'is', null);
    }

    query = query.orderBy('createdAt', 'desc');

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return await query.execute();
  }

  async getByUserIdPaginated(
    userId: string,
    pagination: PaginationOptions,
    options?: {
      includeSeen?: boolean;
    },
  ) {
    const {page, limit, offset, sortOrder} = pagination;

    // Build base query for count and data
    let baseQuery = this.db
      .selectFrom('notifications')
      .where('userId', '=', userId)
      .where('deletedAt', 'is', null);

    if (options?.includeSeen === false) {
      baseQuery = baseQuery.where('seenAt', 'is', null);
    }

    // Get total count
    const totalResult = await baseQuery
      .select(eb => [eb.fn.count('id').as('total')])
      .executeTakeFirst();

    const total = Number(totalResult?.total || 0);

    // Get paginated notifications
    // Always sort by createdAt descending (most recent first) for notifications
    const notifications = await baseQuery
      .selectAll()
      .select([channelsAsJsonb])
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return mapToPaginatedResponse(notifications, {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    });
  }

  async getUnseenCount(userId: string) {
    const result = await this.db
      .selectFrom('notifications')
      .select(eb => [eb.fn.count('id').as('count')])
      .where('userId', '=', userId)
      .where('seenAt', 'is', null)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    return Number(result?.count || 0);
  }

  async markAsSeen(notificationId: string, userId: string) {
    // Update the notification
    await this.db
      .updateTable('notifications')
      .set({
        seenAt: new Date(),
        updatedAt: new Date(),
      })
      .where('id', '=', notificationId)
      .where('userId', '=', userId)
      .where('deletedAt', 'is', null)
      .execute();

    // Query it back with proper channels transformation
    return await this.getById(notificationId);
  }

  async markAllAsSeen(userId: string) {
    // Update all notifications
    const updated = await this.db
      .updateTable('notifications')
      .set({
        seenAt: new Date(),
        updatedAt: new Date(),
      })
      .where('userId', '=', userId)
      .where('seenAt', 'is', null)
      .where('deletedAt', 'is', null)
      .returning('id')
      .execute();

    // Query them back with proper channels transformation
    if (updated.length === 0) {
      return [];
    }

    const ids = updated.map(n => n.id);
    return await this.db
      .selectFrom('notifications')
      .selectAll()
      .select([channelsAsJsonb])
      .where('id', 'in', ids)
      .execute();
  }

  async updateStatus(
    notificationId: string,
    status: 'pending' | 'sent' | 'failed' | 'seen',
  ) {
    return await this.db
      .updateTable('notifications')
      .set({
        status,
        updatedAt: new Date(),
      })
      .where('id', '=', notificationId)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Get pending notifications with exponential backoff
   * Only returns notifications that are ready to retry based on retry count
   */
  async getPendingNotifications(limit: number = 100) {
    const now = new Date();

    return await this.db
      .selectFrom('notifications')
      .selectAll()
      .select([channelsAsJsonb])
      .where('status', '=', 'pending')
      .where('deletedAt', 'is', null)
      .where(eb => eb(sql`COALESCE(retry_count, 0)`, '<', 5)) // Max 5 retries
      .orderBy('createdAt', 'asc')
      .orderBy(sql`COALESCE(retry_count, 0)`, 'asc')
      .limit(limit)
      .execute()
      .then(notifications => {
        // Filter by exponential backoff in application code
        // This is a temporary solution until we can use proper SQL with the new column
        return notifications.filter(notification => {
          const retryCount = (notification as any).retryCount ?? 0;
          const baseDelay = 5 * 60 * 1000; // 5 minutes
          const backoffDelay = baseDelay * Math.pow(2, retryCount);
          const retryAfter = new Date(now.getTime() - backoffDelay);
          return notification.createdAt < retryAfter;
        });
      });
  }

  /**
   * Update channel status for a notification
   * channelStatus format: {"email": {"status": "sent", "sentAt": "...", "error": "..."}}
   */
  async updateChannelStatus(
    notificationId: string,
    channelStatus: Record<
      string,
      {status: 'sent' | 'failed'; sentAt?: string; error?: string}
    >,
  ) {
    return await this.db
      .updateTable('notifications')
      .set({
        channelStatus: channelStatus,
        updatedAt: new Date(),
      })
      .where('id', '=', notificationId)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Increment retry count for a notification
   */
  async incrementRetryCount(notificationId: string) {
    return await this.db
      .updateTable('notifications')
      .set({
        retryCount: sql`COALESCE(retry_count, 0) + 1`,
        updatedAt: new Date(),
      })
      .where('id', '=', notificationId)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(notificationId: string, userId: string) {
    return await this.db
      .updateTable('notifications')
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where('id', '=', notificationId)
      .where('userId', '=', userId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Check if a document_reminder notification was already sent for a listing
   * at a specific time (hoursUntilEvent)
   * Uses approximate matching (±1 hour) to handle timing variations
   *
   * This checks both initial notifications (at QR availability) and milestone notifications
   */
  async hasDocumentReminderForListing(
    userId: string,
    listingId: string,
    hoursUntilEvent: number,
  ): Promise<boolean> {
    // Query for document_reminder notifications with matching listingId
    // and hoursUntilEvent within ±1 hour range (to handle timing variations)
    const result = await this.db
      .selectFrom('notifications')
      .select('id')
      .where('userId', '=', userId)
      .where('type', '=', 'document_reminder')
      .where('deletedAt', 'is', null)
      .where(sql`metadata->>'listingId'`, '=', listingId)
      .where(
        sql`CAST(metadata->>'hoursUntilEvent' AS INTEGER)`,
        '>=',
        hoursUntilEvent - 1,
      )
      .where(
        sql`CAST(metadata->>'hoursUntilEvent' AS INTEGER)`,
        '<=',
        hoursUntilEvent + 1,
      )
      .executeTakeFirst();

    return result !== undefined;
  }
}
