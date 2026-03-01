import { sql, type Kysely } from 'kysely';

/**
 * Partial unique index: at most one "active" earning per listing_ticket_id.
 * Allows clone flow: original earning can be failed_payout, clone is available (same listing_ticket_id).
 * Prevents duplicate earnings from duplicate webhooks or bugs.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE UNIQUE INDEX seller_earnings_listing_ticket_id_active_unique
    ON seller_earnings (listing_ticket_id)
    WHERE status != 'failed_payout' AND deleted_at IS NULL
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP INDEX IF EXISTS seller_earnings_listing_ticket_id_active_unique
  `.execute(db);
}
