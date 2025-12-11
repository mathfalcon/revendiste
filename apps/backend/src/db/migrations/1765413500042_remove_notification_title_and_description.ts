import type {Kysely} from 'kysely';

/**
 * Migration to remove redundant columns from notifications table:
 * - title and description: Generated from type + metadata using generateNotificationText()
 * - sent_at, failed_at, error_message: Redundant since channel_status JSONB tracks this per channel
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Drop the columns
  await db.schema
    .alterTable('notifications')
    .dropColumn('title')
    .dropColumn('description')
    .dropColumn('sent_at')
    .dropColumn('failed_at')
    .dropColumn('error_message')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Re-add the columns (nullable for backward compatibility with existing data)
  await db.schema
    .alterTable('notifications')
    .addColumn('title', 'varchar(255)')
    .addColumn('description', 'text')
    .addColumn('sent_at', 'timestamptz')
    .addColumn('failed_at', 'timestamptz')
    .addColumn('error_message', 'text')
    .execute();
}
