import {sql, type Kysely} from 'kysely';

/**
 * Migration to create notification batching tables for debounced notifications.
 *
 * This enables grouping similar notifications within a time window before sending,
 * reducing notification spam (e.g., multiple document uploads for the same order).
 *
 * Tables:
 * - notification_batches: Groups related notifications by debounce key
 * - notification_batch_items: Individual items within a batch
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Create notification batch status enum
  await sql`
    CREATE TYPE notification_batch_status AS ENUM ('pending', 'processed', 'cancelled')
  `.execute(db);

  // Create notification_batches table
  await db.schema
    .createTable('notificationBatches')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('debounceKey', 'varchar(255)', col => col.notNull())
    .addColumn('userId', 'uuid', col =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('notificationType', sql`notification_type`, col => col.notNull())
    .addColumn('channels', sql`notification_channel[]`, col => col.notNull())
    .addColumn('windowEndsAt', 'timestamptz', col => col.notNull())
    .addColumn('status', sql`notification_batch_status`, col =>
      col.notNull().defaultTo('pending'),
    )
    .addColumn('finalNotificationId', 'uuid', col =>
      col.references('notifications.id').onDelete('set null'),
    )
    .addColumn('createdAt', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updatedAt', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  // Create notification_batch_items table
  await db.schema
    .createTable('notificationBatchItems')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('batchId', 'uuid', col =>
      col
        .notNull()
        .references('notificationBatches.id')
        .onDelete('cascade'),
    )
    .addColumn('metadata', 'jsonb', col => col.notNull())
    .addColumn('actions', 'jsonb')
    .addColumn('createdAt', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  // Indexes for notification_batches

  // Index for finding pending batches by debounce key (most common lookup)
  await db.schema
    .createIndex('idx_notification_batches_debounce_key_user_status')
    .on('notificationBatches')
    .columns(['debounceKey', 'userId', 'status'])
    .execute();

  // Index for cronjob: find batches ready to process
  await sql`
    CREATE INDEX idx_notification_batches_pending_window
    ON notification_batches (window_ends_at ASC)
    WHERE status = 'pending'
  `.execute(db);

  // Index for user lookup
  await db.schema
    .createIndex('idx_notification_batches_user_id')
    .on('notificationBatches')
    .column('userId')
    .execute();

  // Indexes for notification_batch_items

  // Index for getting items by batch
  await db.schema
    .createIndex('idx_notification_batch_items_batch_id')
    .on('notificationBatchItems')
    .column('batchId')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop indexes
  await db.schema
    .dropIndex('idx_notification_batch_items_batch_id')
    .ifExists()
    .execute();

  await db.schema
    .dropIndex('idx_notification_batches_user_id')
    .ifExists()
    .execute();

  await sql`DROP INDEX IF EXISTS idx_notification_batches_pending_window`.execute(
    db,
  );

  await db.schema
    .dropIndex('idx_notification_batches_debounce_key_user_status')
    .ifExists()
    .execute();

  // Drop tables
  await db.schema.dropTable('notificationBatchItems').ifExists().execute();
  await db.schema.dropTable('notificationBatches').ifExists().execute();

  // Drop enum
  await sql`DROP TYPE IF EXISTS notification_batch_status`.execute(db);
}
