import type {Kysely} from 'kysely';
import {sql} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TYPE payment_event_type ADD VALUE IF NOT EXISTS 'status_synced'`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  // PostgreSQL doesn't support removing enum values
}
