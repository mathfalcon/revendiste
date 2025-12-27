import {sql, type Kysely} from 'kysely';

/**
 * Migration to add 'failed_payout' status to seller_earnings_status enum
 *
 * This allows us to mark earnings linked to failed/cancelled payouts with a
 * specific status, which can then be excluded from balance calculations.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // PostgreSQL 9.1+ supports adding enum values directly using ALTER TYPE
  // This is safer than dropping and recreating the enum
  await sql`
    ALTER TYPE seller_earnings_status ADD VALUE IF NOT EXISTS 'failed_payout'
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // PostgreSQL doesn't support removing enum values directly.
  // We need to convert to text, update values, drop enum, recreate, and convert back.

  // Step 1: Convert column to text
  await sql`
    ALTER TABLE seller_earnings
    ALTER COLUMN status TYPE text
  `.execute(db);

  // Step 2: Update any 'failed_payout' records back to 'paid_out' (best we can do)
  await sql`
    UPDATE seller_earnings
    SET status = 'paid_out'
    WHERE status = 'failed_payout'
  `.execute(db);

  // Step 3: Drop the enum
  await sql`DROP TYPE seller_earnings_status`.execute(db);

  // Step 4: Recreate enum without 'failed_payout'
  await sql`
    CREATE TYPE seller_earnings_status AS ENUM (
      'pending',
      'available',
      'retained',
      'paid_out'
    )
  `.execute(db);

  // Step 5: Convert column back
  await sql`
    ALTER TABLE seller_earnings
    ALTER COLUMN status TYPE seller_earnings_status USING status::seller_earnings_status
  `.execute(db);
}
