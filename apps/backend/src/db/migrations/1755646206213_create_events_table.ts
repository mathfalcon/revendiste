import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create EVENTS table
  await db.schema
    .createTable('events')
    .addColumn('id', 'uuid', col => col.primaryKey())
    .addColumn('external_id', 'varchar(255)', col => col.unique().notNull())
    .addColumn('platform', 'varchar(50)', col => col.notNull())
    .addColumn('name', 'varchar(500)', col => col.notNull())
    .addColumn('description', 'text')
    .addColumn('event_start_date', 'timestamptz', col => col.notNull())
    .addColumn('event_end_date', 'timestamptz', col => col.notNull())
    .addColumn('venue_name', 'varchar(255)')
    .addColumn('venue_address', 'text', col => col.notNull())
    .addColumn('external_url', 'varchar(1000)', col => col.notNull())
    .addColumn('status', 'varchar(50)', col =>
      col.defaultTo('active').notNull(),
    )
    .addColumn('metadata', 'jsonb')
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('last_scraped_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  // Create indexes for better performance
  await db.schema
    .createIndex('events_platform_idx')
    .on('events')
    .column('platform')
    .execute();

  await db.schema
    .createIndex('events_external_id_idx')
    .on('events')
    .column('external_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('events').execute();
}
