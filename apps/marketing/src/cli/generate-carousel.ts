import 'dotenv/config';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {generateCover, type CoverDeck} from '../ai/cover-image';
import {howToBuySlides} from '../carousels/data/how-to-buy';
import {howToSellSlides} from '../carousels/data/how-to-sell';
import {
  describeAssets,
  renderCarouselToPngs,
  type CarouselKind,
} from '../carousels/render';
import type {CarouselSlide} from '../carousels/types';
import {capture} from '../screenshots/capture';

const marketingRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

const SLIDES: Record<CarouselKind, CarouselSlide[]> = {
  'how-to-sell': howToSellSlides,
  'how-to-buy': howToBuySlides,
  'how-to-post': howToSellSlides,
};

const VALID_KINDS: CarouselKind[] = ['how-to-sell', 'how-to-buy', 'how-to-post'];

type CliOpts = {
  kind: CarouselKind;
  capture: boolean;
  cover: boolean;
};

function parseArgs(argv: string[]): CliOpts {
  const flagIdx = argv.indexOf('--kind');
  const flagValue = flagIdx >= 0 ? argv[flagIdx + 1] : undefined;
  const positional = argv.find(a => VALID_KINDS.includes(a as CarouselKind));
  const kind = ((flagValue ?? positional) as CarouselKind | undefined) ?? 'how-to-sell';
  return {
    kind: VALID_KINDS.includes(kind) ? kind : 'how-to-sell',
    capture: argv.includes('--capture'),
    cover: argv.includes('--cover'),
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const slides = SLIDES[opts.kind];
  const out = join(marketingRoot, 'output', `carousel-${opts.kind}`);

  if (opts.cover) {
    try {
      await generateCover(opts.kind as CoverDeck);
    } catch (e) {
      console.warn(
        `! No se pudo generar el cover (${e instanceof Error ? e.message : String(e)}).\n  El render usará el fondo gradiente como fallback.`,
      );
    }
  }

  if (opts.capture) {
    const baseUrl = process.env.FRONTEND_URL ?? 'https://127.0.0.1:3000';
    const screenshotKeys = slides
      .filter((s): s is Extract<CarouselSlide, {kind: 'screenshot'}> =>
        s.kind === 'screenshot',
      )
      .map(s => s.screenshotKey);

    if (screenshotKeys.length > 0) {
      try {
        await capture({baseUrl, only: screenshotKeys});
      } catch (e) {
        console.warn(
          `! No se pudieron capturar screenshots (${e instanceof Error ? e.message : String(e)}).\n  El render mostrará "Captura no disponible" en esas slides.`,
        );
      }
    }
  }

  // Diagnostic: tell the user which optional assets are missing.
  const assets = describeAssets(opts.kind, slides);
  if (!assets.coverExists) {
    console.warn(
      `! Cover faltante: ${assets.coverPath}\n  Ejecutá con --cover para generarlo, o subí un PNG manualmente.`,
    );
  }
  for (const s of assets.screenshots) {
    if (!s.exists) {
      console.warn(
        `! Screenshot faltante "${s.key}" → ${s.path}\n  Ejecutá con --capture (frontend en FRONTEND_URL).`,
      );
    }
  }

  const paths = await renderCarouselToPngs(opts.kind, slides, out);
  console.info(
    `\nCarousel "${opts.kind}" — ${paths.length} slides:\n${paths.join('\n')}`,
  );
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
