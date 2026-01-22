import {runScrapeEvents} from '../src/cronjobs/scrape-events';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

const startTime = Date.now();

runScrapeEvents()
  .then(() => {
    const duration = Date.now() - startTime;
    console.log(`\n✅ Scrape events completed in ${formatDuration(duration)} (${duration}ms)`);
    process.exit(0);
  })
  .catch(error => {
    const duration = Date.now() - startTime;
    console.error(`\n❌ Scrape events failed after ${formatDuration(duration)} (${duration}ms):`, error);
    process.exit(1);
  });

