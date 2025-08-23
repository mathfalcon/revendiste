import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create EVENT_TICKET_WAVES table
  await db.schema
    .createTable('event_ticket_waves')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('event_id', 'uuid', col => col.notNull().references('events.id'))
    .addColumn('external_id', 'varchar(255)', col => col.unique().notNull())
    .addColumn('name', 'varchar(255)', col => col.notNull())
    .addColumn('description', 'text')
    .addColumn('face_value', 'numeric', col => col.notNull())
    .addColumn('currency', 'varchar(3)', col => col.notNull())
    .addColumn('is_sold_out', 'boolean', col => col.defaultTo(false).notNull())
    .addColumn('is_available', 'boolean', col => col.defaultTo(true).notNull())
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
    .addColumn('deleted_at', 'timestamptz')
    .execute();

  // Create indexes for better performance
  await db.schema
    .createIndex('event_ticket_waves_external_id_idx')
    .on('event_ticket_waves')
    .column('external_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('event_ticket_waves').execute();
}
