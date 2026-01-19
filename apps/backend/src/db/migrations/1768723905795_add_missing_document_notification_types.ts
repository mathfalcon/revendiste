import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add new notification types for missing document refund system
  await sql`ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'seller_earnings_retained'`.execute(
    db,
  );
  await sql`ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'buyer_ticket_cancelled'`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  // Note: PostgreSQL doesn't support removing values from enums
  // The values will remain but won't be used
}
