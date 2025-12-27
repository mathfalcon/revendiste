import {sql, type Kysely} from 'kysely';

/**
 * Migration to add payout notification types to notification_type enum
 *
 * This migration:
 * 1. Converts column to text temporarily
 * 2. Drops the old enum
 * 3. Creates new enum with payout notification types added:
 *    - payout_processing
 *    - payout_completed
 *    - payout_failed
 *    - payout_cancelled
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

  // Step 3: Create new enum with all values (including payout notification types)
  await sql`
    CREATE TYPE notification_type AS ENUM (
      'ticket_sold_seller',
      'document_reminder',
      'order_confirmed',
      'order_expired',
      'payment_failed',
      'payment_succeeded',
      'document_uploaded',
      'payout_processing',
      'payout_completed',
      'payout_failed',
      'payout_cancelled'
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

  // Step 3: Recreate enum without payout notification types
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

  // Step 4: Convert column back to enum
  await sql`
    ALTER TABLE notifications
    ALTER COLUMN type TYPE notification_type USING type::notification_type
  `.execute(db);
}
