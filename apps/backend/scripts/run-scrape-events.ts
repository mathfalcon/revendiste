import {runScrapeEvents} from '../src/cronjobs/scrape-events';
import {Platform} from '../src/services/scraping/base/types';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

const validPlatforms = Object.values(Platform);

function parsePlatformArgs(): Platform[] | undefined {
  const args = process.argv.slice(2);

  if (args.length === 0) return undefined;

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`Usage: pnpm scrape-events [--only <platform,...>]`);
    console.log(`\nPlatforms: ${validPlatforms.join(', ')}`);
    console.log(`\nExamples:`);
    console.log(`  pnpm scrape-events                        # scrape all`);
    console.log(
      `  pnpm scrape-events --only tickantel        # scrape only tickantel`,
    );
    console.log(`  pnpm scrape-events --only entraste,redtickets`);
    process.exit(0);
  }

  const onlyIdx = args.indexOf('--only');
  if (onlyIdx === -1) return undefined;

  const platformArg = args[onlyIdx + 1];
  if (!platformArg) {
    console.error('Error: --only requires a comma-separated list of platforms');
    console.error(`Valid platforms: ${validPlatforms.join(', ')}`);
    process.exit(1);
  }

  const requested = platformArg.split(',').map(p => p.trim().toLowerCase());
  const platforms: Platform[] = [];

  for (const name of requested) {
    if (validPlatforms.includes(name as Platform)) {
      platforms.push(name as Platform);
    } else {
      console.error(`Error: unknown platform "${name}"`);
      console.error(`Valid platforms: ${validPlatforms.join(', ')}`);
      process.exit(1);
    }
  }

  return platforms;
}

const platforms = parsePlatformArgs();
const startTime = Date.now();

const label = platforms ? `[${platforms.join(', ')}]` : '[all platforms]';

console.log(`\nScraping ${label}...\n`);

runScrapeEvents(platforms)
  .then(() => {
    const duration = Date.now() - startTime;
    console.log(
      `\n✅ Scrape events ${label} completed in ${formatDuration(duration)} (${duration}ms)`,
    );
    process.exit(0);
  })
  .catch(error => {
    const duration = Date.now() - startTime;
    console.error(
      `\n❌ Scrape events failed after ${formatDuration(duration)} (${duration}ms):`,
      error,
    );
    process.exit(1);
  });
