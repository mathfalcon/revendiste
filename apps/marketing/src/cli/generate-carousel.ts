import 'dotenv/config';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {howToSellSlides} from '../carousels/data/how-to-sell';
import {renderCarouselToPngs} from '../carousels/render';

const marketingRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

async function main() {
  const fromUser = process.argv.filter(a => a.startsWith('how-to-')).at(-1);
  const kind =
    (fromUser as 'how-to-sell' | 'how-to-buy' | 'how-to-post') ?? 'how-to-sell';
  const out = join(marketingRoot, 'output', `carousel-${kind}`);
  const paths = await renderCarouselToPngs(kind, howToSellSlides, out);
  console.info('Wrote:\n' + paths.join('\n'));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
