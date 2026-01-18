import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create enum for refund tracking
  await sql`
    CREATE TYPE listing_ticket_refund_status AS ENUM (
      'refund_pending',
      'refunded',
      'refund_failed'
    )
  `.execute(db);

  // Add column (nullable - null means no refund needed)
  await sql`
    ALTER TABLE listing_tickets 
    ADD COLUMN refund_status listing_ticket_refund_status
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Remove column
  await sql`
    ALTER TABLE listing_tickets 
    DROP COLUMN IF EXISTS refund_status
  `.execute(db);

  // Drop enum
  await sql`DROP TYPE IF EXISTS listing_ticket_refund_status`.execute(db);
}
