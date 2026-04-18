/**
 * Debug script to scrape a single event URL using the actual scraper logic.
 * This uses the exact same code paths as the production scraper, just for one URL.
 *
 * Usage:
 *   pnpm tsx src/scripts/debug-scrape.ts <platform> <url>
 *
 * Examples:
 *   pnpm tsx src/scripts/debug-scrape.ts entraste https://entraste.com/evento/some-event
 *   pnpm tsx src/scripts/debug-scrape.ts redtickets https://redtickets.uy/evento/12345/some-event
 *
 * Environment variables:
 *   LOG_LEVEL=debug  - Enable debug logging to see detailed extraction info
 */

import {EntrasteScraper} from '~/services/scraping/entraste';
import {RedTicketsScraper} from '~/services/scraping/redtickets';
import {TickantelScraper} from '~/services/scraping/tickantel';
import type {ScrapedEventData} from '~/services/scraping/base/types';

const platform = process.argv[2];
const url = process.argv[3];

if (!platform || !url) {
  console.error(
    'Usage: pnpm tsx src/scripts/debug-scrape.ts <platform> <url>\n',
  );
  console.error('  platform: entraste | redtickets');
  console.error('  url: The event detail page URL to scrape\n');
  console.error('Examples:');
  console.error(
    '  pnpm tsx src/scripts/debug-scrape.ts entraste https://entraste.com/evento/some-event',
  );
  console.error(
    '  pnpm tsx src/scripts/debug-scrape.ts redtickets https://redtickets.uy/evento/12345/some-event',
  );
  console.error('\nTip: Use LOG_LEVEL=debug for detailed extraction logs');
  process.exit(1);
}

if (!['entraste', 'redtickets', 'tickantel'].includes(platform)) {
  console.error(`Unknown platform: ${platform}`);
  console.error('Supported platforms: entraste, redtickets, tickantel');
  process.exit(1);
}

function printEventData(event: ScrapedEventData): void {
  console.log('\n' + '='.repeat(60));
  console.log('SCRAPED EVENT DATA');
  console.log('='.repeat(60) + '\n');

  console.log('--- BASIC INFO ---');
  console.log(`Name: ${event.name}`);
  console.log(`Platform: ${event.platform}`);
  console.log(`External ID: ${event.externalId}`);
  console.log(`External URL: ${event.externalUrl}`);
  console.log(
    `Description: ${event.description?.substring(0, 200)}${event.description && event.description.length > 200 ? '...' : ''}`,
  );

  console.log('\n--- VENUE ---');
  console.log(`Venue Name: ${event.scrapedVenueName || 'NOT FOUND'}`);
  console.log(`Venue Address: ${event.scrapedVenueAddress || 'NOT FOUND'}`);
  console.log(
    `Coordinates: ${event.scrapedVenueLatitude && event.scrapedVenueLongitude ? `${event.scrapedVenueLatitude}, ${event.scrapedVenueLongitude}` : 'NOT FOUND'}`,
  );

  console.log('\n--- DATES ---');
  console.log(
    `Start Date: ${event.eventStartDate?.toISOString() || 'NOT FOUND'}`,
  );
  console.log(`End Date: ${event.eventEndDate?.toISOString() || 'NOT FOUND'}`);

  console.log('\n--- IMAGES ---');
  if (event.images && event.images.length > 0) {
    event.images.forEach((img, i) => {
      console.log(`  ${i + 1}. [${img.type}] ${img.url}`);
    });
  } else {
    console.log('  No images found');
  }

  console.log('\n--- TICKET WAVES ---');
  if (event.ticketWaves && event.ticketWaves.length > 0) {
    event.ticketWaves.forEach((wave, i) => {
      const status = wave.isSoldOut ? ' (SOLD OUT)' : '';
      console.log(
        `  ${i + 1}. ${wave.name} - ${wave.currency} ${wave.faceValue}${status}`,
      );
    });
  } else {
    console.log('  No ticket waves found');
  }

  console.log('\n' + '='.repeat(60));
}

async function main(): Promise<void> {
  console.log(`\nDebug scraping ${platform} URL: ${url}`);
  console.log('Using the SAME extraction logic as the production scraper\n');

  let results: ScrapedEventData[] = [];

  if (platform === 'entraste') {
    const scraper = new EntrasteScraper();
    const r = await scraper.debugScrapeUrl(url);
    if (r) results = [r];
  } else if (platform === 'redtickets') {
    const scraper = new RedTicketsScraper();
    const r = await scraper.debugScrapeUrl(url);
    if (r) results = [r];
  } else if (platform === 'tickantel') {
    const scraper = new TickantelScraper();
    results = await scraper.debugScrapeUrlAll(url);
  }

  if (results.length > 0) {
    console.log(`\nTotal events extracted: ${results.length}`);
    results.forEach(printEventData);
    console.log('\n✅ Debug scrape completed successfully\n');
  } else {
    console.error('\n❌ Debug scrape failed - no event data extracted\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
