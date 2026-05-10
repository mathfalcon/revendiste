/**
 * Render ONE carousel slide to a single PNG for fast layout/debug iteration.
 * Uses existing screenshots under output/screenshots/ (no Playwright).
 *
 * Examples:
 *   pnpm carousel:debug-slide -- --kind how-to-buy --screenshot
 *   pnpm carousel:debug-slide -- --kind how-to-buy --index 2
 *   pnpm carousel:debug-slide -- --kind how-to-buy --index 2 --out /tmp/x.png
 */
import 'dotenv/config';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {howToBuySlides} from '../carousels/data/how-to-buy';
import {howToSellSlides} from '../carousels/data/how-to-sell';
import {whatIsRevendisteSlides} from '../carousels/data/what-is-revendiste';
import {
  renderCarouselSlideAtIndex,
  type CarouselKind,
} from '../carousels/render';
import type {CarouselSlide} from '../carousels/types';

const marketingRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

const SLIDES: Record<CarouselKind, CarouselSlide[]> = {
  'how-to-sell': howToSellSlides,
  'how-to-buy': howToBuySlides,
  'what-is-revendiste': whatIsRevendisteSlides,
};

const VALID_KINDS: CarouselKind[] = [
  'how-to-sell',
  'how-to-buy',
  'what-is-revendiste',
];

function parseKind(argv: string[]): CarouselKind {
  const i = argv.indexOf('--kind');
  const v = i >= 0 ? argv[i + 1] : undefined;
  const pos = argv.find(a => VALID_KINDS.includes(a as CarouselKind));
  const k = (v ?? pos) as CarouselKind | undefined;
  return k && VALID_KINDS.includes(k) ? k : 'how-to-buy';
}

function parseIndex(argv: string[], slides: CarouselSlide[]): number {
  if (argv.includes('--screenshot')) {
    const idx = slides.findIndex(s => s.kind === 'screenshot');
    if (idx < 0) {
      throw new Error('Este deck no tiene ninguna slide kind=screenshot.');
    }
    return idx;
  }
  const i = argv.indexOf('--index');
  if (i < 0 || !argv[i + 1]) {
    throw new Error(
      'Pasá --index N (0-based) o --screenshot (primera slide screenshot).',
    );
  }
  return Number.parseInt(argv[i + 1]!, 10);
}

function parseOut(argv: string[]): string {
  const i = argv.indexOf('--out');
  if (i >= 0 && argv[i + 1]) {
    return argv[i + 1]!;
  }
  return join(marketingRoot, 'output', 'carousel-debug-slide.png');
}

async function main() {
  const argv = process.argv.slice(2);
  const kind = parseKind(argv);
  const slides = SLIDES[kind];
  const slideIndex = parseIndex(argv, slides);
  const outFile = parseOut(argv);

  await renderCarouselSlideAtIndex(kind, slides, slideIndex, outFile);

  const slide = slides[slideIndex]!;
  console.info(
    `Wrote ${outFile}\n  deck=${kind} index=${slideIndex} kind=${slide.kind}`,
  );
}

main().catch(e => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
