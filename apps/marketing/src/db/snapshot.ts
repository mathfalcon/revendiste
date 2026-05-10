import 'dotenv/config';
import {mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const marketingRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = join(marketingRoot, 'seeds');
const url =
  process.env.MARKETING_DATABASE_URL ??
  'postgresql://marketing:marketing@127.0.0.1:5544/marketing';

function main() {
  mkdirSync(outDir, {recursive: true});
  const outFile = join(outDir, '_snapshot.dump');
  const r = spawnSync('pg_dump', ['--format=custom', '--file', outFile, url], {
    stdio: 'inherit',
    shell: false,
  });
  if (r.status !== 0) {
    console.error(
      'pg_dump failed. Install PostgreSQL client tools or run from a machine with pg_dump.',
    );
    process.exit(r.status ?? 1);
  }
  console.info(`Wrote ${outFile}`);
}

main();
