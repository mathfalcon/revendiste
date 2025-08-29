import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create USERS table
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('clerk_id', 'varchar(255)', col => col.unique().notNull())
    .addColumn('email', 'varchar(255)', col => col.unique().notNull())
    .addColumn('first_name', 'varchar(100)')
    .addColumn('last_name', 'varchar(100)')
    .addColumn('image_url', 'varchar(1000)')
    .addColumn('last_active_at', 'timestamptz')
    .addColumn('metadata', 'jsonb')
    .addColumn('created_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamptz', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('deleted_at', 'timestamptz')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('users').execute();
}
