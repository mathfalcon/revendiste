import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create EVENT_IMAGES table
  await db.schema
    .createTable('event_images')
    .addColumn('id', 'uuid', col => col.primaryKey())
    .addColumn('event_id', 'integer', col =>
      col.notNull().references('events.id'),
    )
    .addColumn('image_type', 'varchar(50)', col => col.notNull())
    .addColumn('url', 'varchar(1000)', col => col.notNull())
    .addColumn('alt_text', 'varchar(500)')
    .addColumn('display_order', 'integer', col => col.defaultTo(0).notNull())
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('event_images').execute();
}
