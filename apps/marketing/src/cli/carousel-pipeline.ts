/**
 * Opinionated carousel build for humans + agents: defaults to --capture and
 * --cover unless disabled. Use --render-only for Satori-only (no Playwright,
 * no Higgsfield).
 *
 *   pnpm carousel:pipeline -- --kind how-to-sell
 *   pnpm carousel:pipeline -- how-to-sell
 *   pnpm carousel:pipeline -- --kind how-to-sell --render-only
 */
import 'dotenv/config';
import {runGenerateCarousel, VALID_KINDS} from './generate-carousel';
import type {CarouselKind} from '../carousels/render';

function printHelp(): void {
  console.info(`
Carousel pipeline (@revendiste/marketing)

Uso:
  pnpm carousel:pipeline -- --kind how-to-sell
  pnpm carousel:pipeline -- how-to-sell

Por defecto añade --capture y --cover (frontend en FRONTEND_URL + Higgsfield si está instalado).

Opciones extra (se reenvían a generate-carousel):
  --render-only     Solo render Satori → PNG (sin --capture ni --cover)
  --no-capture      Sin Playwright
  --no-cover        Sin cover AI (gradiente en la tapa)
  --help, -h        Este mensaje

Decks: ${VALID_KINDS.join(' | ')}

Guía detallada: apps/marketing/.claude/skills/marketing-carousel-pipeline/SKILL.md
`);
}

function hasKind(argv: string[]): boolean {
  if (argv.includes('--kind')) {
    return true;
  }
  return argv.some(a => VALID_KINDS.includes(a as CarouselKind));
}

function buildArgv(raw: string[]): string[] {
  if (raw.includes('--help') || raw.includes('-h')) {
    return raw;
  }

  const renderOnly = raw.includes('--render-only');
  const args = raw.filter(a => a !== '--render-only');

  if (renderOnly) {
    return args.filter(
      a => !['--capture', '--cover', '--no-capture', '--no-cover'].includes(a),
    );
  }

  const out = [...args];
  if (!out.includes('--capture') && !out.includes('--no-capture')) {
    out.push('--capture');
  }
  if (!out.includes('--cover') && !out.includes('--no-cover')) {
    out.push('--cover');
  }
  return out;
}

async function main(): Promise<void> {
  const raw = process.argv.slice(2).filter(a => a !== '--');
  if (raw.length === 0 || raw.includes('--help') || raw.includes('-h')) {
    printHelp();
    process.exit(raw.length === 0 ? 1 : 0);
  }

  const argv = buildArgv(raw);
  if (argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  if (!hasKind(argv)) {
    console.error(
      'Error: falta el deck. Ejemplo: pnpm carousel:pipeline -- --kind how-to-sell\n' +
        `Decks válidos: ${VALID_KINDS.join(', ')}`,
    );
    process.exit(1);
  }

  await runGenerateCarousel(argv);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
