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
 * - local + localhost: no SSL needed
 * - local + remote (e.g., Supabase): SSL enabled
 * - development: SSL enabled
 * - production: SSL enabled with rejectUnauthorized: false (RDS within AWS network)
 */
function getSslConfig(): boolean | {rejectUnauthorized: boolean} {
 
  if (NODE_ENV === 'local') {
    if (POSTGRES_HOST.includes('localhost')) {
      return false;
    }
    return true;
  }

  return {
    rejectUnauthorized: false, // Skip certificate verification for RDS (connection is within AWS network)
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
