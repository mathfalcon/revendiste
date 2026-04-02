import type {Kysely} from 'kysely';
import {sql} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // 1. Add nullable slug column
  await db.schema
    .alterTable('events')
    .addColumn('slug', 'varchar(600)')
    .execute();

  // 2. Populate slugs for existing events
  // Transliterate Spanish chars, lowercase, replace non-alphanumeric with hyphens, collapse/trim
  await sql`
    WITH base_slugs AS (
      SELECT
        id,
        TRIM(BOTH '-' FROM
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              LOWER(
                TRANSLATE(name, 'áéíóúñüÁÉÍÓÚÑÜ', 'aeiounuAEIOUNU')
              ),
              '[^a-z0-9]+', '-', 'g'
            ),
            '-+', '-', 'g'
          )
        ) AS base_slug,
        ROW_NUMBER() OVER (
          PARTITION BY TRIM(BOTH '-' FROM
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                LOWER(
                  TRANSLATE(name, 'áéíóúñüÁÉÍÓÚÑÜ', 'aeiounuAEIOUNU')
                ),
                '[^a-z0-9]+', '-', 'g'
              ),
              '-+', '-', 'g'
            )
          )
          ORDER BY "created_at"
        ) AS rn
      FROM events
    )
    UPDATE events
    SET slug = CASE
      WHEN base_slugs.rn = 1 THEN base_slugs.base_slug
      ELSE base_slugs.base_slug || '-' || base_slugs.rn
    END
    FROM base_slugs
    WHERE events.id = base_slugs.id
  `.execute(db);

  // 3. Set NOT NULL constraint
  await db.schema
    .alterTable('events')
    .alterColumn('slug', col => col.setNotNull())
    .execute();

  // 4. Add unique index
  await db.schema
    .createIndex('idx_events_slug_unique')
    .on('events')
    .column('slug')
    .unique()
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_events_slug_unique').execute();
  await db.schema.alterTable('events').dropColumn('slug').execute();
}
