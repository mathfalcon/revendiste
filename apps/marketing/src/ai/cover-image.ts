/**
 * Cover-image generation helper.
 *
 * Wraps `higgsfield generate create gpt_image_2 --prompt ... --wait` to
 * produce a 1080x1350 cover image for a carousel deck. Saves the result to
 * `apps/marketing/brand/covers/<deck>.png` so the next render picks it up.
 *
 * Requires the `higgsfield` CLI on $PATH and an active session
 * (`higgsfield account status`). Otherwise we throw with a clear message.
 */
import {createWriteStream} from 'node:fs';
import {mkdir} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {higgsfieldGenerateCreate} from './higgsfield';

const marketingRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const COVERS_DIR = join(marketingRoot, 'brand', 'covers');

export type CoverDeck = 'how-to-buy' | 'how-to-sell' | 'how-to-post';

const DEFAULT_PROMPTS: Record<CoverDeck, string> = {
  'how-to-buy':
    'Editorial poster, vertical 4:5, vivid magenta-to-orange brand gradient, ' +
    'bold typographic mood, abstract concert lighting, ticket QR motifs ' +
    'subtle, premium ad aesthetic, no text, leave bottom 40% darker for ' +
    'overlay text. Instagram carousel cover.',
  'how-to-sell':
    'Editorial poster, vertical 4:5, magenta-to-orange brand gradient, ' +
    'bold confident mood, hand passing a glowing concert ticket, abstract ' +
    'energy lines, premium ad aesthetic, no text, leave bottom 40% darker ' +
    'for overlay text. Instagram carousel cover.',
  'how-to-post':
    'Editorial poster, vertical 4:5, magenta-to-orange brand gradient, ' +
    'phone in hand uploading a ticket, soft neon glow, premium ad ' +
    'aesthetic, no text, leave bottom 40% darker for overlay text. ' +
    'Instagram carousel cover.',
};

export function coverPath(deck: CoverDeck): string {
  return join(COVERS_DIR, `${deck}.png`);
}

/** Pulls the first http(s) URL out of higgsfield's stdout. */
function extractUrl(stdout: string): string | null {
  const match = stdout.match(/https?:\/\/\S+/);
  return match ? match[0] : null;
}

async function downloadTo(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(
      `Falló la descarga del cover (${res.status} ${res.statusText})`,
    );
  }
  await mkdir(dirname(dest), {recursive: true});
  await pipeline(
    Readable.fromWeb(res.body as unknown as import('stream/web').ReadableStream<Uint8Array>),
    createWriteStream(dest),
  );
}

export async function generateCover(
  deck: CoverDeck,
  options?: {prompt?: string; aspectRatio?: string; resolution?: string},
): Promise<string> {
  const prompt = options?.prompt ?? DEFAULT_PROMPTS[deck];
  const aspectRatio = options?.aspectRatio ?? '4:5';
  const resolution = options?.resolution ?? '2k';

  console.info(`Higgsfield: rendering cover for ${deck} (${aspectRatio}, ${resolution})…`);

  const result = await higgsfieldGenerateCreate('gpt_image_2', prompt, [
    '--aspect_ratio',
    aspectRatio,
    '--resolution',
    resolution,
    '--wait',
  ]);

  if (result.code !== 0) {
    const hint = /not found|command not found/i.test(result.stderr)
      ? '¿Está instalado el CLI de Higgsfield? https://github.com/higgsfield-ai/cli'
      : /session expired|not authenticated/i.test(result.stderr)
        ? 'Corré `higgsfield auth login` y volvé a intentar.'
        : '';
    throw new Error(
      `higgsfield falló (exit ${result.code}). ${hint}\n${result.stderr}`,
    );
  }

  const url = extractUrl(result.stdout);
  if (!url) {
    throw new Error(
      `No encontré una URL en la salida de higgsfield:\n${result.stdout}`,
    );
  }

  const dest = coverPath(deck);
  await downloadTo(url, dest);
  console.info(`✓ Cover guardado en ${dest}`);
  return dest;
}
