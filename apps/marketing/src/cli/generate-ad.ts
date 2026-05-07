/**
 * CLI: render Spritz (or future compositions) and optionally enqueue DB row.
 * Usage: pnpm generate-ad [--render-id <uuid>] [--brief-slug spritz-hook-10s]
 */
import 'dotenv/config';
import {randomUUID} from 'node:crypto';
import {executeSpritzRender} from '../render/remotion-exec';
import {db, destroyDb} from '../db/index';

async function main() {
  const args = process.argv.slice(2);
  let renderId = '';
  let briefSlug = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--render-id' && args[i + 1]) {
      renderId = args[++i]!;
    }
    if (args[i] === '--brief-slug' && args[i + 1]) {
      briefSlug = args[++i]!;
    }
  }

  if (!renderId) {
    renderId = randomUUID();
  }

  if (briefSlug) {
    const brief = await db
      .selectFrom('briefs')
      .select('id')
      .where('slug', '=', briefSlug)
      .executeTakeFirst();
    if (!brief) {
      throw new Error(`Brief not found: ${briefSlug}`);
    }
    await db
      .insertInto('renders')
      .values({
        id: renderId,
        briefId: brief.id,
        variantLabel: 'cli-generate-ad',
        engine: 'remotion',
        status: 'queued',
        params: {} as any,
        assetUrls: null,
        durationMs: null,
        errorMessage: null,
        createdAt: new Date(),
      })
      .execute();
  }

  const out = await executeSpritzRender(briefSlug ? renderId : null);
  console.info(
    `Done. Output: ${out}${briefSlug ? ` renderId=${renderId}` : ''}`,
  );
}

main()
  .catch(e => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await destroyDb();
  });
