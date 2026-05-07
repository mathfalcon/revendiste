import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('publish_logs')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('campaign_id', 'uuid', col =>
      col.references('campaigns.id').onDelete('set null'),
    )
    .addColumn('platform', 'varchar(50)', col => col.notNull())
    .addColumn('request_payload', 'jsonb')
    .addColumn('response_payload', 'jsonb')
    .addColumn('http_status', 'integer')
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('publish_logs').execute();
}
