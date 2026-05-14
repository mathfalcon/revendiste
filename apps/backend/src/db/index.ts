import {CamelCasePlugin, Kysely, PostgresDialect} from 'kysely';
import {Pool} from 'pg';
import {
  DATABASE_URL,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
  NODE_ENV,
} from '../config/env';
import {DB} from '@revendiste/shared';

/**
 * Determines SSL configuration based on NODE_ENV and connection target
 * - local + localhost: no SSL
 * - local + remote (e.g., Supabase): SSL on
 * - development/production: SSL off for plain Postgres (e.g. Docker service `postgres`);
 *   SSL on for RDS / managed hosts (hostname does not look like local compose)
 */
function getSslConfig(): boolean | {rejectUnauthorized: boolean} {
  if (NODE_ENV === 'local') {
    if (POSTGRES_HOST.includes('localhost')) {
      return false;
    }
    return true;
  }

  // Single-EC2 dev compose uses host `postgres` with no TLS. RDS uses *.rds.amazonaws.com etc.
  const host = POSTGRES_HOST.toLowerCase();
  if (host === 'postgres' || host === 'localhost' || host === '127.0.0.1') {
    return false;
  }

  return {
    rejectUnauthorized: false, // RDS / managed PG — verify cert chain not required on private paths
  };
}

/**
 * Build pool configuration
 * If DATABASE_URL is set, use it directly (e.g., Supabase pooler URL)
 * Otherwise, construct from individual POSTGRES_* variables
 */
function getPoolConfig() {
  const ssl = getSslConfig();

  return {
    host: POSTGRES_HOST,
    port: POSTGRES_PORT,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    database: POSTGRES_DB,
    ssl,
  };
}

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool(getPoolConfig()),
  }),
  plugins: [new CamelCasePlugin()],
});
