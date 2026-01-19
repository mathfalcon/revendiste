import type {Kysely} from 'kysely';
import {sql} from 'kysely';

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  // Add 'payout_requested' to seller_earnings_status enum
  // This status represents earnings that are linked to a pending payout but not yet paid out
  await sql`ALTER TYPE seller_earnings_status ADD VALUE IF NOT EXISTS 'payout_requested'`.execute(
    db,
  );
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  // Note: PostgreSQL does not support removing values from an enum
  // The enum value will remain but won't be used after rollback
  // This is a known limitation of PostgreSQL enums
}
