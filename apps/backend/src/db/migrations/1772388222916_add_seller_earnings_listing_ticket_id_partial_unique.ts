import {sql, type Kysely} from 'kysely';

/**
 * Partial unique index: at most one "active" earning per listing_ticket_id.
 * Allows clone flow: original earning can be failed_payout, clone is available (same listing_ticket_id).
 * Prevents duplicate earnings from duplicate webhooks or bugs.
 *
 * Predicate constraints (PostgreSQL):
 * - Do not use `status::text` here — casts in partial-index predicates must be IMMUTABLE.
 * - Do not use `status != 'failed_payout'` — can error with "unsafe use of new enum value" if this
 *   runs in the same transaction as `ALTER TYPE ... ADD VALUE 'failed_payout'`.
 * So we list every non-failed_payout label that exists when this migration runs (see
 * 1766443202567, 1768511937269). If you add a new status that should participate in this
 * uniqueness rule, ship a follow-up migration that drops and recreates this index.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE UNIQUE INDEX seller_earnings_listing_ticket_id_active_unique
    ON seller_earnings (listing_ticket_id)
    WHERE status IN (
      'pending',
      'available',
      'retained',
      'paid_out',
      'payout_requested'
    )
    AND deleted_at IS NULL
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP INDEX IF EXISTS seller_earnings_listing_ticket_id_active_unique
  `.execute(db);
}
