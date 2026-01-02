import {runScrapeEvents} from '../src/cronjobs/scrape-events';

runScrapeEvents()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

