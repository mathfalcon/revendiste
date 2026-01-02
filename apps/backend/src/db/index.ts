import {CamelCasePlugin, Kysely, PostgresDialect} from 'kysely';
import {Pool} from 'pg';
import {
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
  NODE_ENV,
} from '../config/env';
import {DB} from '@revendiste/shared';

/**
 * Determines SSL configuration based on NODE_ENV
 * - local: no SSL needed (localhost)
 * - development: SSL enabled (may connect to remote DB with proper certificates)
 * - production: SSL enabled with rejectUnauthorized: false (RDS within AWS network)
 */
function getSslConfig(): boolean | {rejectUnauthorized: boolean} {
  if (NODE_ENV === 'local') {
    return false;
  }

  if (NODE_ENV === 'production') {
    return {
      rejectUnauthorized: false, // Skip certificate verification for RDS (connection is within AWS network)
    };
  }

  // development: SSL enabled
  return true;
}

const sslConfig = getSslConfig();

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
      user: POSTGRES_USER,
      password: POSTGRES_PASSWORD,
      database: POSTGRES_DB,
      ssl: sslConfig,
    }),
  }),
  plugins: [new CamelCasePlugin()],
});
