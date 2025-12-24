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

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
      user: POSTGRES_USER,
      password: POSTGRES_PASSWORD,
      database: POSTGRES_DB,
      ssl: POSTGRES_USER === 'postgres' ? false : true,
    }),
  }),
  plugins: [new CamelCasePlugin()],
});
