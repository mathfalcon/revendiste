import {sql, type Kysely} from 'kysely';

/**
 * Migration to split 'ticket_sold' notification type into 'ticket_sold_buyer' and 'ticket_sold_seller'
 *
 * This migration:
 * 1. Adds new enum values 'ticket_sold_buyer' and 'ticket_sold_seller'
 * 2. Updates existing 'ticket_sold' records based on metadata:
 *    - If metadata has 'listingId' -> 'ticket_sold_seller'
 *    - If metadata has 'orderId' -> 'ticket_sold_buyer'
 * 3. Removes the old 'ticket_sold' enum value
 */
export async function up(db: Kysely<any>): Promise<void> {
  // PostgreSQL doesn't allow using newly added enum values in the same transaction.
  // Solution: Convert to text, update records, then recreate enum with all values.

  // Step 1: Convert column to text temporarily
  await sql`
    ALTER TABLE notifications
    ALTER COLUMN type TYPE text
  `.execute(db);

  // Step 2: Update existing 'ticket_sold' records based on metadata
  // Seller notifications have listingId in metadata, buyer notifications have orderId
  await sql`
    UPDATE notifications
    SET type = CASE
      WHEN metadata::jsonb ? 'listingId' THEN 'ticket_sold_seller'
      WHEN metadata::jsonb ? 'orderId' THEN 'ticket_sold_buyer'
      ELSE 'ticket_sold_buyer'  -- Default to buyer if unclear
    END
    WHERE type = 'ticket_sold'
  `.execute(db);

  // Step 3: Drop the old enum
  await sql`
    DROP TYPE notification_type
  `.execute(db);

  // Step 4: Create new enum with all values (including the new ones, without 'ticket_sold')
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

  // Step 5: Convert column back to use the new enum
  await sql`
    ALTER TABLE notifications
    ALTER COLUMN type TYPE notification_type USING type::notification_type
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Reverse the migration: merge back to 'ticket_sold'

  // Step 1: Change column to text
  await sql`
    ALTER TABLE notifications
    ALTER COLUMN type TYPE text
  `.execute(db);

  // Step 2: Update all ticket_sold_buyer and ticket_sold_seller to ticket_sold
  await sql`
    UPDATE notifications
    SET type = 'ticket_sold'
    WHERE type IN ('ticket_sold_buyer', 'ticket_sold_seller')
  `.execute(db);

  // Step 3: Drop the new enum
  await sql`
    DROP TYPE notification_type
  `.execute(db);

  // Step 4: Recreate enum with 'ticket_sold'
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

  // Step 5: Change column back to enum
  await sql`
    ALTER TABLE notifications
    ALTER COLUMN type TYPE notification_type USING type::notification_type
  `.execute(db);
}
