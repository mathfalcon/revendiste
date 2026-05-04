import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'seller_earnings_available'`.execute(
    db,
  );
}

export async function down(_db: Kysely<any>): Promise<void> {
  // PostgreSQL does not support removing enum values
}
