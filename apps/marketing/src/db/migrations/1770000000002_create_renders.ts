import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('renders')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('brief_id', 'uuid', col =>
      col.notNull().references('briefs.id').onDelete('cascade'),
    )
    .addColumn('variant_label', 'varchar(500)')
    .addColumn('engine', 'varchar(50)', col => col.notNull())
    .addColumn('status', 'varchar(50)', col =>
      col.defaultTo('queued').notNull(),
    )
    .addColumn('params', 'jsonb')
    .addColumn('asset_urls', 'jsonb')
    .addColumn('duration_ms', 'integer')
    .addColumn('error_message', 'text')
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  await db.schema
    .createIndex('renders_brief_id_idx')
    .on('renders')
    .column('brief_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('renders').execute();
}
