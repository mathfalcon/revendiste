import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('briefs')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('slug', 'varchar(255)', col => col.notNull().unique())
    .addColumn('title', 'varchar(500)', col => col.notNull())
    .addColumn('kind', 'varchar(50)', col => col.notNull())
    .addColumn('status', 'varchar(50)', col => col.defaultTo('draft').notNull())
    .addColumn('prompt', 'text', col => col.notNull())
    .addColumn('props', 'jsonb', col =>
      col.notNull().defaultTo(sql`'{}'::jsonb`),
    )
    .addColumn('tags', sql`text[]`)
    .addColumn('target_platforms', sql`text[]`)
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  await db.schema
    .createIndex('briefs_status_idx')
    .on('briefs')
    .column('status')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('briefs').execute();
}
