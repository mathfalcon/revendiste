import {sql, type Kysely} from 'kysely';

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`.execute(db);

  await db.schema
    .createIndex('events_name_trigram')
    .on('events')
    .using('gin')
    .expression(sql`("name") gin_trgm_ops`)
    .execute();
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('events_name_trigram').ifExists().execute();

  await sql`DROP EXTENSION IF EXISTS "pg_trgm"`.execute(db);
}
