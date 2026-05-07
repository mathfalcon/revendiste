import {execFileSync} from 'node:child_process';
import {
  existsSync,
  readFileSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {db} from '../db/index';
import {putMarketingObject} from '../lib/s3';
import {parseSpritzProps} from '../remotion/computeSpritzDuration';

const marketingRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Renders SpritzHookAd to MP4. If `renderId` matches a row in `renders`, status + MinIO keys are updated.
 *
 * Brief props (from `briefs.props`) are merged over defaults via
 * `parseSpritzProps`, then passed to Remotion CLI as `--props=<file>`.
 */
export async function executeSpritzRender(
  renderId?: string | null,
): Promise<string> {
  const outDir = join(marketingRoot, 'output');
  mkdirSync(outDir, {recursive: true});
  const fileName = renderId ? `${renderId}.mp4` : 'spritz-local.mp4';
  const outFile = join(outDir, fileName);

  const row = renderId
    ? await db
        .selectFrom('renders')
        .innerJoin('briefs', 'briefs.id', 'renders.briefId')
        .select([
          'renders.id as id',
          'renders.briefId as briefId',
          'briefs.props as briefProps',
        ])
        .where('renders.id', '=', renderId)
        .executeTakeFirst()
    : undefined;

  if (row) {
    await db
      .updateTable('renders')
      .set({status: 'running'})
      .where('id', '=', renderId!)
      .execute();
  }

  // Build the Remotion CLI args, optionally including the brief's props.
  const props = parseSpritzProps(row?.briefProps);
  const propsFile = join(outDir, `${renderId ?? 'spritz-local'}.props.json`);
  writeFileSync(propsFile, JSON.stringify(props), 'utf-8');

  // Always log what we're about to render so "wrong text" is never a mystery.
  const firstWord = props.hook[0] ?? '(empty hook)';
  const source = row ? `brief ${row.briefId}` : 'defaults (no DB row)';
  console.info(
    `[spritz-render] renderId=${renderId ?? 'local'} source=${source} ` +
      `hook[0]=${JSON.stringify(firstWord)} hookLen=${props.hook.length} ` +
      `wps=${props.wordsPerSecond}`,
  );

  try {
    execFileSync(
      'pnpm',
      [
        'exec',
        'remotion',
        'render',
        'src/remotion/index.ts',
        'SpritzHookAd',
        outFile,
        `--props=${propsFile}`,
      ],
      {cwd: marketingRoot, stdio: 'inherit', env: {...process.env}},
    );

    if (!existsSync(outFile)) {
      throw new Error(`Expected output missing: ${outFile}`);
    }

    if (row && renderId) {
      const buf = readFileSync(outFile);
      const key = `renders/${renderId}.mp4`;
      await putMarketingObject(key, buf, 'video/mp4');

      await db
        .updateTable('renders')
        .set({
          status: 'done',
          assetUrls: {mp4Key: key} as any,
          errorMessage: null,
        })
        .where('id', '=', renderId)
        .execute();
    }

    return outFile;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (row && renderId) {
      await db
        .updateTable('renders')
        .set({status: 'failed', errorMessage: msg})
        .where('id', '=', renderId)
        .execute();
    }
    throw e;
  } finally {
    try {
      rmSync(propsFile, {force: true});
    } catch {
      /* best-effort cleanup */
    }
  }
}
