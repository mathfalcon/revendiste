import {sql, type Kysely} from 'kysely';

/**
 * Migration to add 'document_uploaded' to notification_type enum
 *
 * This migration:
 * 1. Converts column to text temporarily
 * 2. Drops the old enum
 * 3. Creates new enum with 'document_uploaded' added
 * 4. Converts column back to use the new enum
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Step 1: Convert column to text temporarily
  await sql`
    ALTER TABLE notifications
    ALTER COLUMN type TYPE text
  `.execute(db);

  // Step 2: Drop the old enum
  await sql`
    DROP TYPE notification_type
  `.execute(db);

  // Step 3: Create new enum with all values (including 'document_uploaded')
  await sql`
    CREATE TYPE notification_type AS ENUM (
      'ticket_sold_buyer',
      'ticket_sold_seller',
      'document_reminder',
      'order_confirmed',
      'order_expired',
      'payment_failed',
      'payment_succeeded',
      'document_uploaded'
    )
  `.execute(db);

  // Step 4: Convert column back to use the new enum
  await sql`
    ALTER TABLE notifications
    ALTER COLUMN type TYPE notification_type USING type::notification_type
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Step 1: Convert column to text
  await sql`
    ALTER TABLE notifications
    ALTER COLUMN type TYPE text
  `.execute(db);

  // Step 2: Drop the new enum
  await sql`
    DROP TYPE notification_type
  `.execute(db);

  // Step 3: Recreate enum without 'document_uploaded'
  await sql`
    CREATE TYPE notification_type AS ENUM (
      'ticket_sold_buyer',
      'ticket_sold_seller',
      'document_reminder',
      'order_confirmed',
      'order_expired',
      'payment_failed',
      'payment_succeeded'
    )
  `.execute(db);

  // Step 4: Convert column back to enum
  await sql`
    ALTER TABLE notifications
    ALTER COLUMN type TYPE notification_type USING type::notification_type
  `.execute(db);
}
