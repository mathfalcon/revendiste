import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('campaigns')
    .addColumn('name', 'varchar(255)')
    .execute();

  await db.schema
    .alterTable('campaigns')
    .addColumn('objective', 'varchar(50)')
    .execute();

  await db.schema
    .alterTable('campaigns')
    .addColumn('destination_url', 'text')
    .execute();

  await db.schema.alterTable('campaigns').addColumn('utm', 'jsonb').execute();

  await db.schema
    .alterTable('campaigns')
    .addColumn('paused_at', 'timestamptz')
    .execute();

  await db.schema
    .createTable('audiences_cache')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('platform', 'varchar(50)', col => col.notNull())
    .addColumn('ad_account_id', 'varchar(128)', col => col.notNull())
    .addColumn('payload', 'jsonb')
    .addColumn('fetched_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  await sql`
    CREATE UNIQUE INDEX audiences_cache_platform_ad_account_unique
    ON audiences_cache (platform, ad_account_id)
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS audiences_cache_platform_ad_account_unique`.execute(
    db,
  );
  await db.schema.dropTable('audiences_cache').execute();

  await db.schema.alterTable('campaigns').dropColumn('paused_at').execute();
  await db.schema.alterTable('campaigns').dropColumn('utm').execute();
  await db.schema
    .alterTable('campaigns')
    .dropColumn('destination_url')
    .execute();
  await db.schema.alterTable('campaigns').dropColumn('objective').execute();
  await db.schema.alterTable('campaigns').dropColumn('name').execute();
}
