import {sql, type Kysely} from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create user_role enum type
  await sql`CREATE TYPE user_role AS ENUM ('user', 'organizer', 'admin')`.execute(
    db,
  );

  // Add role column with default 'user'
  await db.schema
    .alterTable('users')
    .addColumn('role', sql`user_role`, col => col.defaultTo('user').notNull())
    .execute();

  // Add index on role for performance
  await db.schema
    .createIndex('users_role_idx')
    .on('users')
    .column('role')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop index
  await db.schema.dropIndex('users_role_idx').on('users').ifExists().execute();

  // Drop role column
  await db.schema.alterTable('users').dropColumn('role').execute();

  // Drop enum type
  await sql`DROP TYPE IF EXISTS user_role`.execute(db);
}
