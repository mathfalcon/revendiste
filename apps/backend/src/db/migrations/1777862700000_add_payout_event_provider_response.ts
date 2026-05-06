import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TYPE payout_event_type ADD VALUE IF NOT EXISTS 'provider_response'
  `.execute(db);
}

export async function down(_db: Kysely<any>): Promise<void> {
  // PostgreSQL cannot remove enum values safely; no-op.
}
