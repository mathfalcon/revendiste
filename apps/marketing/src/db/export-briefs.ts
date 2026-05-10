import 'dotenv/config';
import {mkdirSync, writeFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {db, destroyDb} from './index';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../../seeds/briefs');

async function main() {
  const rows = await db
    .selectFrom('briefs')
    .selectAll()
    .orderBy('slug', 'asc')
    .execute();

  mkdirSync(outDir, {recursive: true});
  for (const row of rows) {
    const payload = {
      slug: row.slug,
      title: row.title,
      kind: row.kind,
      status: row.status,
      prompt: row.prompt,
      props: row.props as Record<string, unknown>,
      tags: row.tags,
      targetPlatforms: row.targetPlatforms,
    };
    const path = join(outDir, `${row.slug}.json`);
    writeFileSync(path, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
    console.info(`Exported ${path}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await destroyDb();
  });
