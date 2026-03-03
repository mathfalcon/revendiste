import { sql, type Kysely } from 'kysely';

/**
 * Migration to create jobs table for generic PostgreSQL-backed job queue.
 * Uses SKIP LOCKED pattern for atomic job claiming by workers.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed')
  `.execute(db);

  await db.schema
    .createTable('jobs')
    .addColumn('id', 'uuid', col =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('job_type', 'varchar(100)', col => col.notNull())
    .addColumn('payload', 'jsonb', col => col.notNull())
    .addColumn('status', sql`job_status`, col =>
      col.notNull().defaultTo('pending'),
    )
    .addColumn('attempts', 'integer', col => col.notNull().defaultTo(0))
    .addColumn('max_attempts', 'integer', col => col.notNull().defaultTo(5))
    .addColumn('scheduled_at', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('created_at', 'timestamptz', col =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('started_at', 'timestamptz')
    .addColumn('completed_at', 'timestamptz')
    .addColumn('error', 'text')
    .addColumn('idempotency_key', 'varchar(255)', col => col.unique())
    .execute();

  await sql`
    CREATE INDEX idx_jobs_pending ON jobs (scheduled_at)
    WHERE status = 'pending'
  `.execute(db);

  await db.schema
    .createIndex('idx_jobs_type_status')
    .on('jobs')
    .columns(['job_type', 'status'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('idx_jobs_type_status').ifExists().execute();
  await sql`DROP INDEX IF EXISTS idx_jobs_pending`.execute(db);
  await db.schema.dropTable('jobs').ifExists().execute();
  await sql`DROP TYPE IF EXISTS job_status`.execute(db);
}
