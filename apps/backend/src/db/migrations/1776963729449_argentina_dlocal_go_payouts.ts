import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TYPE payout_type ADD VALUE IF NOT EXISTS 'argentinian_bank'`.execute(
    db,
  );
  await sql`ALTER TYPE payout_provider ADD VALUE IF NOT EXISTS 'dlocal_go'`.execute(
    db,
  );
  await sql`ALTER TYPE event_ticket_currency ADD VALUE IF NOT EXISTS 'ARS'`.execute(
    db,
  );
}

export async function down(_db: Kysely<unknown>): Promise<void> {
  // Enum values are not removed (PostgreSQL limitation); migration is forward-only.
}
