import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Remove refund_status column from listing_tickets
  await sql`
    ALTER TABLE listing_tickets 
    DROP COLUMN IF EXISTS refund_status
  `.execute(db);

  // Drop the enum type
  await sql`DROP TYPE IF EXISTS listing_ticket_refund_status`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Recreate enum for refund tracking
  await sql`
    CREATE TYPE listing_ticket_refund_status AS ENUM (
      'refund_pending',
      'refunded',
      'refund_failed'
    )
  `.execute(db);

  // Re-add column (nullable)
  await sql`
    ALTER TABLE listing_tickets 
    ADD COLUMN refund_status listing_ticket_refund_status
  `.execute(db);
}
