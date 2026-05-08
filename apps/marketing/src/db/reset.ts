import 'dotenv/config';
import {spawnSync} from 'node:child_process';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {sql} from 'kysely';
import {db, destroyDb} from './index';

const marketingRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Truncates all marketing data tables and re-runs seed (keeps migration history).
 */
async function main() {
  await sql`TRUNCATE TABLE publish_logs, campaigns, renders, briefs, audiences_cache CASCADE`.execute(
    db,
  );
  console.info(
    'Truncated briefs, renders, campaigns, publish_logs, audiences_cache.',
  );
  await destroyDb();

  const r = spawnSync('pnpm', ['db:seed'], {
    cwd: marketingRoot,
    stdio: 'inherit',
    shell: true,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
