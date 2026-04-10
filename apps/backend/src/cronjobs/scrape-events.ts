import cron from 'node-cron';
import {EntrasteScraper} from '../services/scraping/entraste';
import {RedTicketsScraper} from '../services/scraping/redtickets';
import {TickantelScraper} from '../services/scraping/tickantel';
import {ScrapingService} from '~/services/scraping';
import {EventsService} from '~/services/events';
import {VenuesService} from '~/services/venues';
import {GooglePlacesService} from '~/services/google-places';
import {EventsRepository, VenuesRepository} from '~/repositories';
import {db} from '~/db';
import {logger, startMemoryMonitor, logMemoryUsage} from '~/utils';

/**
 * Runs the scrape events job logic once
 * Used by production EventBridge + ECS RunTask
 */
export async function runScrapeEvents() {
  const eventsRepository = new EventsRepository(db);
  const venuesRepository = new VenuesRepository(db);
  const googlePlacesService = new GooglePlacesService();
  const venuesService = new VenuesService(
    venuesRepository,
    googlePlacesService,
  );
  const scrapingService = new ScrapingService(
    [new EntrasteScraper(), new RedTicketsScraper(), new TickantelScraper()],
    new EventsService(eventsRepository, venuesRepository),
    venuesService,
  );

  // Start memory monitoring (logs every 10 seconds)
  const stopMemoryMonitor = startMemoryMonitor(10000);

  try {
    logger.info('Starting event scraping...');
    logMemoryUsage('before-scrape');

    const result = await scrapingService.scrapeEvents();

    logMemoryUsage('after-scrape');
    logger.info('Event scraping completed', {
      eventsScraped: result.length,
    });
  } catch (error) {
    logger.error('Error scraping events:', error);
    throw error;
  } finally {
    stopMemoryMonitor();
  }
}

/**
 * Starts the cron scheduler for scrape events job
 * Only used in development/local environments
 * In production, use runScrapeEvents() via EventBridge
 */
export function startScrapeEventsJob() {
  // Run once a day at midnight
  const job = cron.schedule('0 0 * * *', async () => {
    try {
      await runScrapeEvents();
    } catch (error) {
      logger.error('Error in scheduled event scraping:', error);
    }
  });

  logger.info(
    'Scheduled job: scrape-events started (runs once a day at midnight)',
  );

  return job;
}
