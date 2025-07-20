import {CamelCasePlugin, Kysely, PostgresDialect} from 'kysely';
import {Pool} from 'pg';
import {
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
} from '../config/env';
import {DB} from '~/types';

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
      user: POSTGRES_USER,
      password: POSTGRES_PASSWORD,
      database: POSTGRES_DB,
    }),
  }),
  plugins: [new CamelCasePlugin()],
});
