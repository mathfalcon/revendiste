import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  sql`CREATE TYPE event_image_type AS ENUM ('flyer', 'hero')`.execute(db);

  await sql`
    ALTER TABLE event_images
    ALTER COLUMN image_type TYPE event_image_type
    USING image_type::event_image_type
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('event_images')
    .alterColumn('image_type', col => col.setDataType('varchar(50)'))
    .execute();

  await sql`DROP TYPE event_image_type`.execute(db);
}
