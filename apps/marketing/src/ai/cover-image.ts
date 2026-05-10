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
import {brandTokens} from '../brand/tokens';
import {higgsfieldGenerateCreate} from './higgsfield';

const marketingRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const COVERS_DIR = join(marketingRoot, 'brand', 'covers');

export type CoverDeck =
  | 'how-to-buy'
  | 'how-to-sell'
  | 'what-is-revendiste';

/**
 * GPT Image 2 prompts for carousel covers. English reads reliably on image
 * models; on-slide copy stays Spanish in Satori. Palette from `brandTokens`.
 */
function buildCarouselCoverPrompt(deckMotif: string): string {
  const [mag, orn] = brandTokens.gradient;
  const deep = brandTokens.background;
  const primary = brandTokens.primary;

  return [
    'Tall portrait hero background for an Instagram carousel first slide (final canvas 1080x1350; headlines added later in design).',
    `Brand palette: electric magenta (${mag}) dissolving into hot orange (${orn}), with ${deep} anchoring shadows; hero magenta accent ${primary} (logo primary, not pastel pink); occasional rim light in the same hue family.`,
    'Mood: premium Latin American live-music night, trustworthy resale marketplace—confident, not gimmicky; avoid crypto / meme-stock clichés.',
    'Look: cinematic haze, soft stage bokeh, gentle anamorphic streaks; abstract crowd as color and silhouette only—no recognizable faces or celebrities.',
    'Motifs: frosted glass shards suggesting a ticket stub, soft hex dot grids evoking QR energy—nothing readable, no real QR codes, no app UI.',
    'Hard rules: no text, letters, numbers, logos, watermarks, or phone screen mockups.',
    `Composition: vertical color momentum; bottom 42% is clearly darker (deep ${deep} translucent wash) so white display type can sit on top.`,
    `Deck focus: ${deckMotif}`,
    'Finish: ultra-clean editorial ad plate, subtle fine grain optional, high dynamic range.',
  ].join(' ');
}

const DEFAULT_PROMPTS: Record<CoverDeck, string> = {
  'how-to-buy': buildCarouselCoverPrompt(
    'Buyer journey—warm spotlight opening like a door to the pit, anticipation and safety, "your night is sorted" energy without literal tickets.',
  ),
  'how-to-sell': buildCarouselCoverPrompt(
    'Seller empowerment—abstract hands-off exchange of light (not literal hands), upward flowing particles, reclaim your night confident glow.',
  ),
  'what-is-revendiste': buildCarouselCoverPrompt(
    'Ticket marketplace introduction—welcoming trust hub, protected payments, verified accounts, clear rules, event-night confidence without implying only resale.',
  ),
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
  // gpt_image_2 allows 3:4 (closest portrait to 1080x1350); 4:5 is not valid on current API.
  const aspectRatio = options?.aspectRatio ?? '3:4';
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
    const stderr = `${result.stderr}\n${result.stdout}`;
    const hint = /not found|command not found|not recognized as an internal or external command/i.test(
      stderr,
    )
      ? '¿Instalaste el CLI? https://github.com/higgsfield-ai/cli — En Windows, si no está en el PATH, definí HIGGSFIELD_CLI con la ruta completa al ejecutable.'
      : /session expired|not authenticated/i.test(stderr)
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
