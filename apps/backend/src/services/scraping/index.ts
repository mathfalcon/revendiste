import {BaseScraper} from './base';
import {EventsService} from '../events';

export class ScrapingService {
  constructor(
    private readonly scrapers: BaseScraper[],
    private readonly eventsService: EventsService,
  ) {}

  async scrapeEvents() {
    const eventsArrays = await Promise.all(
      this.scrapers.map(scraper => scraper.scrapeEvents()),
    );

    // Flatten the array of arrays into a single array of events
    const allEvents = eventsArrays.flat();

    await this.eventsService.storeScrapedEvents(allEvents);

    return allEvents;
  }
}

export * from './base/types';
export * from './base';
export * from './entraste';
