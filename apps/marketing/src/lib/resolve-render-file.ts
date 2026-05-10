import {existsSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {db} from '../db/index';

const marketingRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Local MP4 path for a render: optional `params.localFilePath`, else `output/{id}.mp4` when present.
 */
export async function resolveRenderVideoPath(
  renderId: string,
): Promise<{path: string; source: 'params' | 'output'} | null> {
  const row = await db
    .selectFrom('renders')
    .select(['params', 'status'])
    .where('id', '=', renderId)
    .executeTakeFirst();
  if (!row) {
    return null;
  }
  const params = row.params as {localFilePath?: string} | null;
  if (params?.localFilePath) {
    const p = params.localFilePath.startsWith('/')
      ? params.localFilePath
      : resolve(marketingRoot, params.localFilePath);
    if (existsSync(p)) {
      return {path: p, source: 'params'};
    }
  }
  const out = join(marketingRoot, 'output', `${renderId}.mp4`);
  if (existsSync(out)) {
    return {path: out, source: 'output'};
  }
  return null;
}

export {marketingRoot};
