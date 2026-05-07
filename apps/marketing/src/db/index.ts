import 'dotenv/config';
import {CamelCasePlugin, Kysely, PostgresDialect} from 'kysely';
import {Pool} from 'pg';
import type {MarketingDatabase} from './types';

function getDatabaseUrl(): string {
  return (
    process.env.MARKETING_DATABASE_URL ??
    'postgresql://marketing:marketing@127.0.0.1:5544/marketing'
  );
}

const pool = new Pool({
  connectionString: getDatabaseUrl(),
  max: 10,
});

export const db = new Kysely<MarketingDatabase>({
  dialect: new PostgresDialect({pool}),
  plugins: [new CamelCasePlugin()],
});

export async function destroyDb(): Promise<void> {
  await db.destroy();
}
