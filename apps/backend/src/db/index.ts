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
  // If using DATABASE_URL, check if it's a remote connection
  if (DATABASE_URL) {
    const isLocalhost =
      DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
    if (isLocalhost) {
      return false;
    }
    // For Supabase and other cloud providers, use SSL
    return {rejectUnauthorized: false};
  }

  if (NODE_ENV === 'local') {
    if (POSTGRES_HOST.includes('localhost')) {
      return false;
    }
    return true;
  }

  if (NODE_ENV === 'production') {
    return {
      rejectUnauthorized: false, // Skip certificate verification for RDS (connection is within AWS network)
    };
  }

  // development: SSL enabled
  return true;
}

/**
 * Build pool configuration
 * If DATABASE_URL is set, use it directly (e.g., Supabase pooler URL)
 * Otherwise, construct from individual POSTGRES_* variables
 */
function getPoolConfig() {
  const ssl = getSslConfig();

  if (DATABASE_URL) {
    return {
      connectionString: DATABASE_URL,
      ssl,
    };
  }

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
