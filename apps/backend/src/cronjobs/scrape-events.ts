import cron from 'node-cron';
import {EntrasteScraper} from '../services/scraping/entraste';
import {ScrapingService} from '~/services/scraping';
import {EventsService} from '~/services/events';
import {EventsRepository} from '~/repositories';
import {db} from '~/db';
import {logger} from '~/utils';

/**
 * Runs the scrape events job logic once
 * Used by production EventBridge + ECS RunTask
 */
export async function runScrapeEvents() {
  const eventsRepository = new EventsRepository(db);
  const scrapingService = new ScrapingService(
    [new EntrasteScraper()],
    new EventsService(eventsRepository),
  );

  try {
    logger.info('Starting event scraping...');

    const result = await scrapingService.scrapeEvents();

    logger.info('Event scraping completed', {
      eventsScraped: result.length,
    });
  } catch (error) {
    logger.error('Error scraping events:', error);
    throw error;
  }
}

/**
 * Starts the cron scheduler for scrape events job
 * Only used in development/local environments
 * In production, use runScrapeEvents() via EventBridge
 */
export function startScrapeEventsJob() {
  // Run every 30 minutes
  const job = cron.schedule('*/30 * * * *', async () => {
    try {
      await runScrapeEvents();
    } catch (error) {
      logger.error('Error in scheduled event scraping:', error);
    }
  });

  logger.info('Scheduled job: scrape-events started (runs every 30 minutes)');

  return job;
}
