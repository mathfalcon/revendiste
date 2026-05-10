import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('campaigns')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('render_id', 'uuid', col =>
      col.notNull().references('renders.id').onDelete('cascade'),
    )
    .addColumn('platform', 'varchar(50)', col => col.notNull())
    .addColumn('mode', 'varchar(50)', col => col.notNull())
    .addColumn('external_ids', 'jsonb')
    .addColumn('targeting', 'jsonb')
    .addColumn('budget_usd', 'double precision')
    .addColumn('status', 'varchar(100)', col =>
      col.defaultTo('pending').notNull(),
    )
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  await db.schema
    .createIndex('campaigns_render_id_idx')
    .on('campaigns')
    .column('render_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('campaigns').execute();
}
