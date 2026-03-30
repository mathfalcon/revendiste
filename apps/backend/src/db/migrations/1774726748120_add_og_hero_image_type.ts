import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TYPE event_image_type ADD VALUE 'og_hero'`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // PostgreSQL doesn't support removing enum values directly.
  // Recreate the type without 'og_hero' and update the column.
  await sql`
    DELETE FROM event_images WHERE image_type = 'og_hero'
  `.execute(db);

  await sql`
    ALTER TABLE event_images
    ALTER COLUMN image_type TYPE varchar(50)
  `.execute(db);

  await sql`DROP TYPE event_image_type`.execute(db);

  await sql`CREATE TYPE event_image_type AS ENUM ('flyer', 'hero')`.execute(db);

  await sql`
    ALTER TABLE event_images
    ALTER COLUMN image_type TYPE event_image_type
    USING image_type::event_image_type
  `.execute(db);
}
