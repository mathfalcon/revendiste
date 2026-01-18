import {Kysely, sql} from 'kysely';
import {DB} from '@revendiste/shared';
import {BaseRepository} from '../base';
import type {
  NotificationChannel,
  NotificationMetadata,
  NotificationType,
} from '@revendiste/shared';

export interface CreateBatchData {
  debounceKey: string;
  userId: string;
  notificationType: NotificationType;
  channels: ('in_app' | 'email' | 'sms')[];
  windowEndsAt: Date;
}

export interface CreateBatchItemData {
  batchId: string;
  metadata: NotificationMetadata;
  actions?: Array<{
    type: string;
    label: string;
    url?: string;
    data?: Record<string, unknown>;
  }> | null;
}

const channelsAsJsonb = sql<NotificationChannel[]>`to_jsonb(channels)`.as(
  'channels',
);

export class NotificationBatchesRepository extends BaseRepository<NotificationBatchesRepository> {
  withTransaction(trx: Kysely<DB>): NotificationBatchesRepository {
    return new NotificationBatchesRepository(trx);
  }

  /**
   * Find a pending batch by debounce key and user ID
   * Used to check if we should add to an existing batch or create a new one
   */
  async findPendingBatchByKey(debounceKey: string, userId: string) {
    return await this.db
      .selectFrom('notificationBatches')
      .selectAll()
      .select([channelsAsJsonb])
      .where('debounceKey', '=', debounceKey)
      .where('userId', '=', userId)
      .where('status', '=', 'pending')
      .executeTakeFirst();
  }

  /**
   * Create a new notification batch
   */
  async createBatch(data: CreateBatchData) {
    return await this.db
      .insertInto('notificationBatches')
      .values({
        debounceKey: data.debounceKey,
        userId: data.userId,
        notificationType: data.notificationType,
        channels: data.channels,
        windowEndsAt: data.windowEndsAt,
        status: 'pending',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Add an item to an existing batch
   */
  async addItemToBatch(data: CreateBatchItemData) {
    return await this.db
      .insertInto('notificationBatchItems')
      .values({
        batchId: data.batchId,
        metadata: JSON.stringify(data.metadata),
        actions:
          data.actions === null
            ? null
            : data.actions
              ? JSON.stringify(data.actions)
              : undefined,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Get all items in a batch
   */
  async getBatchItems(batchId: string) {
    return await this.db
      .selectFrom('notificationBatchItems')
      .selectAll()
      .where('batchId', '=', batchId)
      .orderBy('createdAt', 'asc')
      .execute();
  }

  /**
   * Get batches that are ready to process (window has ended)
   * Uses window_ends_at to determine when a batch should be processed
   */
  async getBatchesReadyToProcess(limit: number = 100) {
    const now = new Date();

    return await this.db
      .selectFrom('notificationBatches')
      .selectAll()
      .select([channelsAsJsonb])
      .where('status', '=', 'pending')
      .where('windowEndsAt', '<=', now)
      .orderBy('windowEndsAt', 'asc')
      .limit(limit)
      .execute();
  }

  /**
   * Mark a batch as processed and link to the final notification
   */
  async markBatchProcessed(batchId: string, finalNotificationId: string) {
    return await this.db
      .updateTable('notificationBatches')
      .set({
        status: 'processed',
        finalNotificationId: finalNotificationId,
        updatedAt: new Date(),
      })
      .where('id', '=', batchId)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Cancel a batch (e.g., if it's no longer needed)
   */
  async cancelBatch(batchId: string) {
    return await this.db
      .updateTable('notificationBatches')
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where('id', '=', batchId)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Get a batch by ID with its items
   */
  async getBatchWithItems(batchId: string) {
    const batch = await this.db
      .selectFrom('notificationBatches')
      .selectAll()
      .select([channelsAsJsonb])
      .where('id', '=', batchId)
      .executeTakeFirst();

    if (!batch) {
      return null;
    }

    const items = await this.getBatchItems(batchId);

    return {
      ...batch,
      items,
    };
  }

  /**
   * Update the window end time for a batch (extends the debounce window)
   */
  async extendBatchWindow(batchId: string, newWindowEndsAt: Date) {
    return await this.db
      .updateTable('notificationBatches')
      .set({
        windowEndsAt: newWindowEndsAt,
        updatedAt: new Date(),
      })
      .where('id', '=', batchId)
      .where('status', '=', 'pending')
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Get count of items in a batch
   */
  async getBatchItemCount(batchId: string): Promise<number> {
    const result = await this.db
      .selectFrom('notificationBatchItems')
      .select(eb => [eb.fn.count('id').as('count')])
      .where('batchId', '=', batchId)
      .executeTakeFirst();

    return Number(result?.count || 0);
  }
}
