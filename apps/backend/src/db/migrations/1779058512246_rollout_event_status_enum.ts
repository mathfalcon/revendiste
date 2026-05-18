import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    DO $$
    BEGIN
      CREATE TYPE event_status AS ENUM (
        'draft',
        'under_review',
        'rejected',
        'published',
        'active',
        'inactive',
        'finished',
        'cancelled'
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END
    $$;
  `.execute(db);

  await sql`
    ALTER TABLE events
    ADD COLUMN IF NOT EXISTS status_v2 event_status
  `.execute(db);

  await sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'status_v2'
      ) THEN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'events' AND column_name = 'status_legacy'
        ) THEN
          UPDATE events
          SET status_v2 = CASE
            WHEN LOWER(COALESCE(TRIM(status_legacy), '')) = 'active' THEN 'active'::event_status
            WHEN LOWER(COALESCE(TRIM(status_legacy), '')) = 'inactive' THEN 'inactive'::event_status
            ELSE 'inactive'::event_status
          END
          WHERE status_v2 IS NULL;
        ELSIF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'events' AND column_name = 'status'
        ) THEN
          UPDATE events
          SET status_v2 = CASE
            WHEN LOWER(COALESCE(TRIM(status::text), '')) = 'active' THEN 'active'::event_status
            WHEN LOWER(COALESCE(TRIM(status::text), '')) = 'inactive' THEN 'inactive'::event_status
            ELSE 'inactive'::event_status
          END
          WHERE status_v2 IS NULL;
        END IF;

        ALTER TABLE events
        ALTER COLUMN status_v2 SET DEFAULT 'active'::event_status,
        ALTER COLUMN status_v2 SET NOT NULL;
      END IF;
    END
    $$;
  `.execute(db);

  await sql`DROP INDEX IF EXISTS idx_events_event_producer_id_status`.execute(
    db,
  );
  await sql`DROP INDEX IF EXISTS idx_events_is_official_status`.execute(db);

  await sql`
    DO $$
    DECLARE
      status_udt_name text;
    BEGIN
      SELECT c.udt_name
      INTO status_udt_name
      FROM information_schema.columns c
      WHERE c.table_name = 'events'
        AND c.column_name = 'status';

      IF status_udt_name IS NOT NULL
         AND status_udt_name <> 'event_status'
         AND NOT EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_name = 'events'
             AND column_name = 'status_legacy'
         ) THEN
        ALTER TABLE events RENAME COLUMN status TO status_legacy;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'events'
          AND column_name = 'status_v2'
      ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'events'
          AND column_name = 'status'
      ) THEN
        ALTER TABLE events RENAME COLUMN status_v2 TO status;
      END IF;
    END
    $$;
  `.execute(db);

  await sql`
    ALTER TABLE events
    ALTER COLUMN status SET DEFAULT 'active'::event_status,
    ALTER COLUMN status SET NOT NULL
  `.execute(db);

  await sql`
    ALTER TABLE events
    DROP COLUMN IF EXISTS status_v2
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

  await sql`
    ALTER TABLE events
    DROP COLUMN IF EXISTS status_legacy
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_events_event_producer_id_status`.execute(
    db,
  );
  await sql`DROP INDEX IF EXISTS idx_events_is_official_status`.execute(db);

  await db.schema
    .alterTable('events')
    .addColumn('status_varchar', 'varchar(50)')
    .execute();

  await sql`
    UPDATE events
    SET status_varchar = CASE
      WHEN status::text = 'active' THEN 'active'
      WHEN status::text = 'inactive' THEN 'inactive'
      ELSE 'inactive'
    END
  `.execute(db);

  await sql`
    ALTER TABLE events
    ALTER COLUMN status_varchar SET DEFAULT 'active',
    ALTER COLUMN status_varchar SET NOT NULL
  `.execute(db);

  await db.schema.alterTable('events').dropColumn('status').execute();

  await db.schema
    .alterTable('events')
    .renameColumn('status_varchar', 'status')
    .execute();

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

  await sql`DROP TYPE IF EXISTS event_status`.execute(db);
}
