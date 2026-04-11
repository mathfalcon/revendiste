import {BaseScraper} from './base';
import {ScraperResult} from './base/types';
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

    // Phase 1: Scraping — returns ScraperResult[] with status metadata
    const scrapeStart = Date.now();
    const results: ScraperResult[] = await Promise.all(
      this.scrapers.map(scraper => scraper.scrapeEvents()),
    );
    const allEvents = results.flatMap(r => r.events);
    const scrapeTime = Date.now() - scrapeStart;

    for (const result of results) {
      logger.info(`Scraper result: ${result.platform}`, {
        status: result.status,
        events: result.events.length,
        urlsProcessed: result.stats.urlsProcessed,
        urlsFailed: result.stats.urlsFailed,
        durationMs: result.durationMs,
        partialReason: result.partialReason,
      });
    }

    logger.info(`Phase 1: Scraping completed`, {
      eventCount: allEvents.length,
      durationMs: scrapeTime,
    });

    // Separate events into categories:
    // 1. Valid events (has at least one paid wave) → ingest normally
    // 2. Guest-list events (has waves but all faceValue === 0) → skip AND soft-delete existing
    // 3. Empty-wave events (no waves at all) → skip but protect from deletion (could be sold out)
    const validEvents: typeof allEvents = [];
    const guestListEvents: typeof allEvents = [];
    const emptyWaveEvents: typeof allEvents = [];

    for (const event of allEvents) {
      const paidWaves = event.ticketWaves.filter(w => w.faceValue > 0);
      if (paidWaves.length > 0) {
        validEvents.push(event);
      } else if (event.ticketWaves.length > 0) {
        // Has waves but all are free → guest list
        guestListEvents.push(event);
      } else {
        // No waves at all → could be sold out
        emptyWaveEvents.push(event);
      }
    }

    if (guestListEvents.length > 0 || emptyWaveEvents.length > 0) {
      logger.info('Filtered scraped events', {
        valid: validEvents.length,
        guestList: guestListEvents.length,
        emptyWaves: emptyWaveEvents.length,
        guestListNames: guestListEvents.map(e => e.name),
      });
    }

    // For cleanup: include valid + empty-wave events as "safe" (won't be deleted)
    // Guest-list events are excluded → will be soft-deleted if they exist in DB
    const eventsForCleanup = [...validEvents, ...emptyWaveEvents];

    // Phase 2: Venue processing
    // Process venues for each event before storing
    // This finds or creates venues based on coordinates/Google Places
    const venueStart = Date.now();
    const BATCH_SIZE = 10; // Increased from 5 for better parallelism
    for (let i = 0; i < validEvents.length; i += BATCH_SIZE) {
      const batch = validEvents.slice(i, i + BATCH_SIZE);
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
      eventCount: validEvents.length,
      durationMs: venueTime,
    });

    // Phase 3: Store events (only valid events with paid ticket waves)
    const storeStart = Date.now();
    await this.eventsService.storeScrapedEvents(validEvents);
    const storeTime = Date.now() - storeStart;
    logger.info(`Phase 3: Event storage completed`, {
      durationMs: storeTime,
    });

    // Phase 4: Per-platform cleanup — only cleanup platforms whose scrapers completed
    const cleanupStart = Date.now();

    for (const result of results) {
      if (result.status !== 'complete') {
        logger.warn(
          `Skipping cleanup for ${result.platform}: status=${result.status}, reason=${result.partialReason}`,
        );
        continue;
      }

      const platformCleanupEvents = eventsForCleanup.filter(
        e => e.platform === result.platform,
      );
      await this.eventsService.cleanupStaleEventsForPlatform(
        result.platform,
        platformCleanupEvents,
      );
    }

    // Always cleanup past-end-date events (independent of scraper status)
    await this.eventsService.cleanupPastEvents();

    const cleanupTime = Date.now() - cleanupStart;
    logger.info(`Phase 4: Cleanup completed`, {
      durationMs: cleanupTime,
    });

    const totalTime = Date.now() - totalStart;
    logger.info(`Scraping pipeline completed`, {
      totalEvents: allEvents.length,
      validEvents: validEvents.length,
      filteredOut: allEvents.length - validEvents.length,
      totalDurationMs: totalTime,
      breakdown: {
        scraping: scrapeTime,
        venues: venueTime,
        storage: storeTime,
        cleanup: cleanupTime,
      },
    });

    return validEvents;
  }
}

export * from './base/types';
export * from './base';
export * from './entraste';
export * from './redtickets';
export * from './tickantel';
export * from './image-service';
