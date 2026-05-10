import 'dotenv/config';
import {db, destroyDb} from '../db/index';
import {parseSpritzProps} from '../remotion/computeSpritzDuration';

/**
 * Print the resolved Spritz props for a brief slug — exactly what the worker
 * would render. Use to debug "wrong text" issues.
 *
 *   pnpm tsx src/cli/inspect-brief.ts spritz-hook-10s
 */
async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: pnpm tsx src/cli/inspect-brief.ts <brief-slug>');
    process.exit(2);
  }

  const row = await db
    .selectFrom('briefs')
    .select(['id', 'slug', 'title', 'updatedAt', 'props'])
    .where('slug', '=', slug)
    .executeTakeFirst();

  if (!row) {
    console.error(`No brief found for slug=${slug}`);
    process.exit(1);
  }

  const resolved = parseSpritzProps(row.props);
  console.info(`brief.id        = ${row.id}`);
  console.info(`brief.slug      = ${row.slug}`);
  console.info(`brief.title     = ${row.title}`);
  console.info(`brief.updatedAt = ${row.updatedAt.toISOString()}`);
  console.info(`hook.length     = ${resolved.hook.length}`);
  console.info(
    `hook[0..4]      = ${JSON.stringify(resolved.hook.slice(0, 5))}`,
  );
  console.info('--- resolved props ---');
  console.info(JSON.stringify(resolved, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await destroyDb();
  });
