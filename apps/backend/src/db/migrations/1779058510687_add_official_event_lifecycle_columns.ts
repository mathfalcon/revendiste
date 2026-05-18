import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('events')
    .addColumn('event_producer_id', 'uuid', col =>
      col.references('event_producers.id').onDelete('set null'),
    )
    .addColumn('is_official', 'boolean', col => col.notNull().defaultTo(false))
    .addColumn('official_resale_enabled', 'boolean', col =>
      col.notNull().defaultTo(false),
    )
    .addColumn('official_resale_max_markup_percent', sql`numeric(5,2)`)
    .addColumn('draft_payload', 'jsonb')
    .addColumn('submitted_at', 'timestamptz')
    .addColumn('approved_at', 'timestamptz')
    .addColumn('approved_by_user_id', 'uuid', col =>
      col.references('users.id').onDelete('set null'),
    )
    .addColumn('rejected_reason', 'text')
    .execute();

  await sql`
    ALTER TABLE events
    ADD CONSTRAINT events_official_resale_markup_chk
    CHECK (
      official_resale_max_markup_percent IS NULL
      OR official_resale_max_markup_percent >= 110
    )
  `.execute(db);

  await sql`
    ALTER TABLE events
    ADD CONSTRAINT events_official_requires_producer_chk
    CHECK (is_official = false OR event_producer_id IS NOT NULL)
  `.execute(db);

  await db.schema
    .createIndex('idx_events_is_official_status')
    .on('events')
    .columns(['is_official', 'status'])
    .execute();

  await db.schema
    .createIndex('idx_events_event_producer_id_status')
    .on('events')
    .columns(['event_producer_id', 'status'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_events_event_producer_id_status`.execute(
    db,
  );
  await sql`DROP INDEX IF EXISTS idx_events_is_official_status`.execute(db);

  await sql`
    ALTER TABLE events
    DROP CONSTRAINT IF EXISTS events_official_requires_producer_chk
  `.execute(db);

  await sql`
    ALTER TABLE events
    DROP CONSTRAINT IF EXISTS events_official_resale_markup_chk
  `.execute(db);

  await db.schema
    .alterTable('events')
    .dropColumn('rejected_reason')
    .dropColumn('approved_by_user_id')
    .dropColumn('approved_at')
    .dropColumn('submitted_at')
    .dropColumn('draft_payload')
    .dropColumn('official_resale_max_markup_percent')
    .dropColumn('official_resale_enabled')
    .dropColumn('is_official')
    .dropColumn('event_producer_id')
    .execute();
}
