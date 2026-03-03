import {sql, type Kysely} from 'kysely';

/**
 * Migration to create rate_limit table for Postgres-backed rate limiting.
 * Used by express-rate-limit custom store (no Redis).
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('rate_limit')
    .addColumn('key', 'varchar(512)', col => col.primaryKey())
    .addColumn('count', 'integer', col => col.notNull().defaultTo(0))
    .addColumn('reset_time', 'timestamptz', col => col.notNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('rate_limit').execute();
}
