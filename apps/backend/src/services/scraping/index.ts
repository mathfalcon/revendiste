import {BaseScraper} from './base';
import {EventsService} from '../events';
import {VenuesService} from '../venues';
import {logger} from '~/utils';

export class ScrapingService {
  constructor(
    private readonly scrapers: BaseScraper[],
    private readonly eventsService: EventsService,
    private readonly venuesService: VenuesService,
  ) {}

  async scrapeEvents() {
    const totalStart = Date.now();

    // Phase 1: Scraping
    const scrapeStart = Date.now();
    const eventsArrays = await Promise.all(
      this.scrapers.map(scraper => scraper.scrapeEvents()),
    );
    const allEvents = eventsArrays.flat();
    const scrapeTime = Date.now() - scrapeStart;
    logger.info(`Phase 1: Scraping completed`, {
      eventCount: allEvents.length,
      durationMs: scrapeTime,
    });

    // Phase 2: Venue processing
    // Process venues for each event before storing
    // This finds or creates venues based on coordinates/Google Places
    const venueStart = Date.now();
    const BATCH_SIZE = 10; // Increased from 5 for better parallelism
    for (let i = 0; i < allEvents.length; i += BATCH_SIZE) {
      const batch = allEvents.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async event => {
          try {
            const venueId = await this.venuesService.findOrCreateVenue(
              event.scrapedVenueName,
              event.scrapedVenueAddress,
              event.scrapedVenueLatitude,
              event.scrapedVenueLongitude,
            );
            event.venueId = venueId ?? undefined;
          } catch (error) {
            logger.warn('Failed to process venue for event', {
              eventName: event.name,
              externalId: event.externalId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            // Continue without venue - event will have null venueId
          }
        }),
      );
    }
    const venueTime = Date.now() - venueStart;
    logger.info(`Phase 2: Venue processing completed`, {
      eventCount: allEvents.length,
      durationMs: venueTime,
    });

    // Phase 3: Store events
    const storeStart = Date.now();
    await this.eventsService.storeScrapedEvents(allEvents);
    const storeTime = Date.now() - storeStart;
    logger.info(`Phase 3: Event storage completed`, {
      durationMs: storeTime,
    });

    // Phase 4: Cleanup
    const cleanupStart = Date.now();
    await this.eventsService.cleanupStaleEvents(allEvents);
    const cleanupTime = Date.now() - cleanupStart;
    logger.info(`Phase 4: Cleanup completed`, {
      durationMs: cleanupTime,
    });

    const totalTime = Date.now() - totalStart;
    logger.info(`Scraping pipeline completed`, {
      totalEvents: allEvents.length,
      totalDurationMs: totalTime,
      breakdown: {
        scraping: scrapeTime,
        venues: venueTime,
        storage: storeTime,
        cleanup: cleanupTime,
      },
    });

    return allEvents;
  }
}

export * from './base/types';
export * from './base';
export * from './entraste';
export * from './redtickets';
export * from './image-service';
