import {EntrasteScraper} from '../services/scraping/entraste';
import {ScrapingService} from '~/services/scraping';
import {EventsService} from '~/services/events';
import {EventsRepository} from '~/repositories';
import {db} from '~/db';
import {logger} from '~/utils';

(async () => {
  try {
    logger.info('Scraping events...');
    const eventsRepository = new EventsRepository(db);
    const scrapingService = new ScrapingService(
      [new EntrasteScraper()],
      new EventsService(eventsRepository),
    );

    const result = await scrapingService.scrapeEvents();
    logger.info(`Scraped ${result.length} events`);
  } catch (error) {
    logger.error('Error scraping events:', error);
  }
})();
