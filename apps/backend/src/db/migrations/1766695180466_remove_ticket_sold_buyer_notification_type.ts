import {sql, type Kysely} from 'kysely';

/**
 * Migration to remove 'ticket_sold_buyer' from notification_type enum
 *
 * This migration:
 * 1. Converts any existing 'ticket_sold_buyer' notifications to 'order_confirmed'
 *    (since buyers now receive order_confirmed instead)
 * 2. Converts column to text temporarily
 * 3. Drops the old enum
 * 4. Creates new enum without 'ticket_sold_buyer'
 * 5. Converts column back to use the new enum
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Step 1: Convert any existing ticket_sold_buyer notifications to order_confirmed
  // (they should have orderId in metadata, which matches order_confirmed structure)
  await sql`
    UPDATE notifications
    SET type = 'order_confirmed'
    WHERE type = 'ticket_sold_buyer'
  `.execute(db);

  // Step 2: Convert column to text temporarily
  await sql`
    ALTER TABLE notifications
    ALTER COLUMN type TYPE text
  `.execute(db);

  // Step 3: Drop the old enum
  await sql`
    DROP TYPE notification_type
  `.execute(db);

  // Step 4: Create new enum without 'ticket_sold_buyer'
  await sql`
    CREATE TYPE notification_type AS ENUM (
      'ticket_sold_seller',
      'document_reminder',
      'order_confirmed',
      'order_expired',
      'payment_failed',
      'payment_succeeded',
      'document_uploaded'
    )
  `.execute(db);

  // Step 5: Convert column back to use the new enum
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

  // Step 3: Recreate enum with 'ticket_sold_buyer' added back
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

  // Step 4: Convert column back to enum
  await sql`
    ALTER TABLE notifications
    ALTER COLUMN type TYPE notification_type USING type::notification_type
  `.execute(db);
}
