import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import type {ReactNode} from 'react';
import type {CarouselSlide} from './templates/HowToSell';
import {HowToBuySlide} from './templates/HowToBuy';
import {HowToPostSlide} from './templates/HowToPost';
import {HowToSellSlide} from './templates/HowToSell';

const W = 1080;
const H = 1350;

const require = createRequire(import.meta.url);

function loadPoppins700(): Buffer {
  const mod = require.resolve(
    '@fontsource/poppins/files/poppins-latin-700-normal.woff',
  );
  return readFileSync(mod);
}

export type CarouselKind = 'how-to-sell' | 'how-to-buy' | 'how-to-post';

function pickRenderer(kind: CarouselKind) {
  switch (kind) {
    case 'how-to-buy':
      return HowToBuySlide;
    case 'how-to-post':
      return HowToPostSlide;
    default:
      return HowToSellSlide;
  }
}

export async function renderCarouselToPngs(
  kind: CarouselKind,
  slides: CarouselSlide[],
  outDir: string,
): Promise<string[]> {
  mkdirSync(outDir, {recursive: true});
  const Renderer = pickRenderer(kind);
  const paths: string[] = [];

  for (let i = 0; i < slides.length; i++) {
    const el = Renderer({
      slide: slides[i]!,
      index: i,
      total: slides.length,
    }) as ReactNode;

    const svg = await satori(el as any, {
      width: W,
      height: H,
      fonts: [
        {
          name: 'Poppins',
          data: loadPoppins700(),
          weight: 700,
          style: 'normal',
        },
      ],
    });

    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    const file = join(outDir, `${String(i + 1).padStart(2, '0')}.png`);
    writeFileSync(file, png);
    paths.push(file);
  }

  return paths;
}
