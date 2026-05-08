import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import satori from 'satori';
import sharp from 'sharp';
import type {ReactNode} from 'react';
import {coverPath, type CoverDeck} from '../ai/cover-image';
import {screenshotPath} from '../screenshots/targets';
import {buildPhoneFramePng} from './phone-frame';
import {ContentSlideTemplate} from './templates/ContentSlide';
import {CoverSlideTemplate} from './templates/CoverSlide';
import {ScreenshotSlideTemplate} from './templates/ScreenshotSlide';
import type {CarouselSlide} from './types';

const W = 1080;
const H = 1350;

const require = createRequire(import.meta.url);
const marketingRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

function loadPoppins(weight: 700 | 800 | 900): Buffer {
  const file =
    weight === 900
      ? '@fontsource/poppins/files/poppins-latin-900-normal.woff'
      : weight === 800
        ? '@fontsource/poppins/files/poppins-latin-800-normal.woff'
        : '@fontsource/poppins/files/poppins-latin-700-normal.woff';
  return readFileSync(require.resolve(file));
}

export type CarouselKind = 'how-to-sell' | 'how-to-buy' | 'how-to-post';

const DEFAULT_BADGE: Record<CarouselKind, string> = {
  'how-to-sell': 'Cómo vender',
  'how-to-buy': 'Cómo comprar',
  'how-to-post': 'Cómo publicar',
};

function defaultCoverPath(kind: CarouselKind): string {
  return coverPath(kind as CoverDeck);
}

async function renderSlideToNode(
  kind: CarouselKind,
  slide: CarouselSlide,
  index: number,
  total: number,
): Promise<ReactNode> {
  switch (slide.kind) {
    case 'cover': {
      // Allow data deck to override; otherwise auto-resolve from brand/covers/.
      const path = slide.backgroundImagePath ?? defaultCoverPath(kind);
      return CoverSlideTemplate({
        slide: {...slide, backgroundImagePath: path},
        total,
      });
    }
    case 'screenshot': {
      const filePath = screenshotPath(slide.screenshotKey);
      let imageDataUrl: string | null = null;
      let frame = await buildPhoneFramePng(
        // Build a 1×1 transparent placeholder when no capture exists, so we
        // still know the frame dimensions for the template.
        existsSync(filePath)
          ? filePath
          : await sharp({
              create: {
                width: 2,
                height: 2,
                channels: 4,
                background: {r: 0, g: 0, b: 0, alpha: 0},
              },
            })
              .png()
              .toBuffer(),
      );
      if (existsSync(filePath)) {
        imageDataUrl = `data:image/png;base64,${frame.buffer.toString('base64')}`;
      } else {
        // Reset so the template renders the "Captura no disponible" fallback,
        // but keep `frame` dims to keep the slide layout consistent.
        imageDataUrl = null;
        frame = {...frame, buffer: Buffer.alloc(0)};
      }
      return ScreenshotSlideTemplate({
        slide,
        index,
        total,
        imageDataUrl,
        frameWidth: frame.width,
        frameHeight: frame.height,
      });
    }
    case 'content':
    default:
      return ContentSlideTemplate({
        slide,
        index,
        total,
        defaultBadge: DEFAULT_BADGE[kind],
      });
  }
}

async function slideNodeToPng(el: ReactNode): Promise<Buffer> {
  const svg = await satori(el as any, {
    width: W,
    height: H,
    fonts: [
      {name: 'Poppins', data: loadPoppins(700), weight: 700, style: 'normal'},
      {name: 'Poppins', data: loadPoppins(800), weight: 800, style: 'normal'},
      {name: 'Poppins', data: loadPoppins(900), weight: 900, style: 'normal'},
    ],
  });
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Render a single deck slide to one PNG (fast iteration on layout). */
export async function renderCarouselSlideAtIndex(
  kind: CarouselKind,
  slides: CarouselSlide[],
  slideIndex: number,
  outFile: string,
): Promise<void> {
  if (slideIndex < 0 || slideIndex >= slides.length) {
    throw new Error(
      `slideIndex ${slideIndex} fuera de rango (0..${slides.length - 1})`,
    );
  }
  const total = slides.length;
  const el = (await renderSlideToNode(
    kind,
    slides[slideIndex]!,
    slideIndex,
    total,
  )) as ReactNode;
  const png = await slideNodeToPng(el);
  mkdirSync(dirname(outFile), {recursive: true});
  writeFileSync(outFile, png);
}

export async function renderCarouselToPngs(
  kind: CarouselKind,
  slides: CarouselSlide[],
  outDir: string,
): Promise<string[]> {
  mkdirSync(outDir, {recursive: true});
  const paths: string[] = [];
  const total = slides.length;

  for (let i = 0; i < slides.length; i++) {
    const el = (await renderSlideToNode(
      kind,
      slides[i]!,
      i,
      total,
    )) as ReactNode;

    const png = await slideNodeToPng(el);
    const file = join(outDir, `${String(i + 1).padStart(2, '0')}.png`);
    writeFileSync(file, png);
    paths.push(file);
  }

  return paths;
}

/** Diagnostic: which optional assets are present for this kind. */
export function describeAssets(kind: CarouselKind, slides: CarouselSlide[]) {
  const cover = defaultCoverPath(kind);
  const screenshots = slides
    .filter((s): s is Extract<CarouselSlide, {kind: 'screenshot'}> =>
      s.kind === 'screenshot',
    )
    .map(s => ({key: s.screenshotKey, path: screenshotPath(s.screenshotKey)}));

  return {
    coverPath: cover,
    coverExists: existsSync(cover),
    screenshots: screenshots.map(s => ({...s, exists: existsSync(s.path)})),
    marketingRoot,
  };
}
