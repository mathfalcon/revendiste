import 'dotenv/config';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {metaPublishFromRender} from '../publishers/meta';
import {tiktokPublishFromRender} from '../publishers/tiktok';

const marketingRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

function parseArgs() {
  const a = process.argv.slice(2);
  let platform = '';
  let mode: 'draft' | 'launch' = 'draft';
  let file = '';
  let confirm = false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--platform' && a[i + 1]) {
      platform = a[++i]!;
    }
    if (a[i] === '--mode' && a[i + 1]) {
      mode = a[++i] as 'draft' | 'launch';
    }
    if (a[i] === '--file' && a[i + 1]) {
      file = a[++i]!;
    }
    if (a[i] === '--confirm') {
      confirm = true;
    }
  }
  return {platform, mode, file, confirm};
}

async function main() {
  const {platform, mode, file, confirm} = parseArgs();
  if (!platform || !file) {
    console.error(
      'Usage: pnpm publish -- --platform meta|tiktok --file path/to/video.mp4 [--mode draft|launch] [--confirm]',
    );
    process.exit(1);
  }
  if (mode === 'launch' && !confirm) {
    console.error('Refusing launch without --confirm');
    process.exit(1);
  }

  const abs = file.startsWith('/') ? file : resolve(marketingRoot, file);
  const input = {
    renderId: 'cli',
    filePath: abs,
    kind: 'video' as const,
    name: 'Revendiste CLI publish',
  };

  if (platform === 'meta') {
    const r = await metaPublishFromRender(input, mode);
    console.info(JSON.stringify(r, null, 2));
  } else if (platform === 'tiktok') {
    const r = await tiktokPublishFromRender(input, mode);
    console.info(JSON.stringify(r, null, 2));
  } else {
    throw new Error(`Unknown platform: ${platform}`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
