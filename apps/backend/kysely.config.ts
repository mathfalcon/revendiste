import {defineConfig} from 'kysely-ctl';
import {db} from './src/db';
import {NODE_ENV} from './src/config/env';

export default defineConfig({
  destroyOnExit: true,
  kysely: db,
  migrations: {
    migrationFolder:
      NODE_ENV !== 'local' ? './dist/src/db/migrations' : './src/db/migrations',
    allowJS: NODE_ENV !== 'local',
    // PostgreSQL: enum labels from `ALTER TYPE ... ADD VALUE` cannot appear in later
    // statements (e.g. partial index predicates) until that ADD VALUE commits. Kysely’s
    // default migrator wraps *all* pending migrations in one outer transaction on Postgres,
    // so a later migration cannot reference a label added in an earlier file in the same
    // `migrate:latest` run. Disabling the outer transaction lets each migration commit
    // before the next (see e.g. 1768511937269 + 1772388222916).
    disableTransactions: true,
  },
});
