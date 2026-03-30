import type {Kysely} from 'kysely';
import {sql} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('eventVenues')
    .addColumn('region', 'varchar(100)')
    .execute();

  await sql`CREATE INDEX idx_event_venues_region ON event_venues (region)`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_event_venues_region`.execute(db);

  await db.schema
    .alterTable('eventVenues')
    .dropColumn('region')
    .execute();
}
