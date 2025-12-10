import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create notification type enum
  await sql`
    CREATE TYPE notification_type AS ENUM (
      'ticket_sold',
      'document_reminder',
      'order_confirmed',
      'order_expired',
      'payment_failed',
      'payment_succeeded'
    )
  `.execute(db);

  // Create notification channel enum
  await sql`
    CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms')
  `.execute(db);

  // Create notification status enum
  await sql`
    CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'seen')
  `.execute(db);

  // Create notifications table
  await db.schema
    .createTable('notifications')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('user_id', 'uuid', col =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('type', sql`notification_type`, col => col.notNull())
    .addColumn('title', 'varchar(255)', col => col.notNull())
    .addColumn('description', 'text', col => col.notNull())
    .addColumn('channels', sql`notification_channel[]`, col => col.notNull()) // Array of channels
    .addColumn('status', sql`notification_status`, col =>
      col.notNull().defaultTo('pending'),
    )
    .addColumn('actions', 'jsonb') // Flexible actions structure: [{type: 'button', label: 'Upload', url: '...'}]
    .addColumn('metadata', 'jsonb') // Additional flexible data
    .addColumn('seen_at', 'timestamptz') // When user marked as seen (in-app only)
    .addColumn('sent_at', 'timestamptz') // When notification was successfully sent
    .addColumn('failed_at', 'timestamptz') // When notification failed to send
    .addColumn('error_message', 'text') // Error message if failed
    .addColumn('created_at', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('deleted_at', 'timestamptz') // Soft delete
    .execute();

  // Create indexes for performance
  await db.schema
    .createIndex('idx_notifications_user_id')
    .on('notifications')
    .column('user_id')
    .execute();

  await db.schema
    .createIndex('idx_notifications_type')
    .on('notifications')
    .column('type')
    .execute();

  await db.schema
    .createIndex('idx_notifications_status')
    .on('notifications')
    .column('status')
    .execute();

  await db.schema
    .createIndex('idx_notifications_created_at')
    .on('notifications')
    .column('created_at')
    .execute();

  // Composite index for common queries (user + status + created_at)
  await db.schema
    .createIndex('idx_notifications_user_status_created')
    .on('notifications')
    .columns(['user_id', 'status', 'created_at'])
    .execute();

  // Partial index for active notifications (not deleted)
  await sql`
    CREATE INDEX idx_notifications_active
    ON notifications (user_id, created_at DESC)
    WHERE deleted_at IS NULL
  `.execute(db);

  // Partial index for unseen notifications
  await sql`
    CREATE INDEX idx_notifications_unseen
    ON notifications (user_id, created_at DESC)
    WHERE seen_at IS NULL AND deleted_at IS NULL
  `.execute(db);

  // Partial index for pending notifications (to be sent)
  await sql`
    CREATE INDEX idx_notifications_pending
    ON notifications (created_at ASC)
    WHERE status = 'pending' AND deleted_at IS NULL
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop indexes
  await db.schema
    .dropIndex('idx_notifications_pending')
    .ifExists()
    .execute();
  await db.schema
    .dropIndex('idx_notifications_unseen')
    .ifExists()
    .execute();
  await db.schema
    .dropIndex('idx_notifications_active')
    .ifExists()
    .execute();
  await db.schema
    .dropIndex('idx_notifications_user_status_created')
    .ifExists()
    .execute();
  await db.schema
    .dropIndex('idx_notifications_created_at')
    .ifExists()
    .execute();
  await db.schema
    .dropIndex('idx_notifications_status')
    .ifExists()
    .execute();
  await db.schema
    .dropIndex('idx_notifications_type')
    .ifExists()
    .execute();
  await db.schema
    .dropIndex('idx_notifications_user_id')
    .ifExists()
    .execute();

  // Drop table
  await db.schema.dropTable('notifications').ifExists().execute();

  // Drop enums
  await sql`DROP TYPE IF EXISTS notification_status`.execute(db);
  await sql`DROP TYPE IF EXISTS notification_channel`.execute(db);
  await sql`DROP TYPE IF EXISTS notification_type`.execute(db);
}

