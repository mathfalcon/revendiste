import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create EVENT_IMAGES table
  await db.schema
    .createTable('event_images')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('event_id', 'uuid', col => col.notNull().references('events.id'))
    .addColumn('image_type', 'varchar(50)', col => col.notNull())
    .addColumn('url', 'varchar(1000)', col => col.notNull())
    .addColumn('display_order', 'integer', col => col.defaultTo(0).notNull())
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('deleted_at', 'timestamptz')
    .execute();

  // Create unique index for upsert functionality
  await db.schema
    .createIndex('event_images_event_id_image_type_unique_idx')
    .on('event_images')
    .columns(['event_id', 'image_type'])
    .unique()
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('event_images').execute();
}
