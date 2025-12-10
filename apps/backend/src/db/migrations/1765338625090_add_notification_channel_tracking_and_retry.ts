import {sql, type Kysely} from 'kysely';

/**
 * Migration to add channel-level tracking and retry count for notifications
 *
 * This migration:
 * 1. Adds `channel_status` JSONB column to track per-channel delivery status
 * 2. Adds `retry_count` integer column for exponential backoff
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Add channel_status column to track per-channel delivery status
  // Format: {"email": {"status": "sent", "sentAt": "...", "error": "..."}, "in_app": {"status": "sent"}}
  await db.schema
    .alterTable('notifications')
    .addColumn('channel_status', 'jsonb', col =>
      col.defaultTo(sql`'{}'::jsonb`),
    )
    .execute();

  // Add retry_count column for exponential backoff
  await db.schema
    .alterTable('notifications')
    .addColumn('retry_count', 'integer', col => col.defaultTo(0).notNull())
    .execute();

  // Create index for retry count queries (pending notifications with retry count)
  await sql`
    CREATE INDEX idx_notifications_pending_retry
    ON notifications (created_at ASC, retry_count ASC)
    WHERE status = 'pending' AND deleted_at IS NULL
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop index
  await sql`DROP INDEX IF EXISTS idx_notifications_pending_retry`.execute(db);

  // Remove columns
  await db.schema
    .alterTable('notifications')
    .dropColumn('retry_count')
    .execute();

  await db.schema
    .alterTable('notifications')
    .dropColumn('channel_status')
    .execute();
}
