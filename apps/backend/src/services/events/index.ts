import {EventsRepository, VenuesRepository} from '~/repositories';
import {NotFoundError} from '~/errors';
import {EVENT_ERROR_MESSAGES} from '~/constants/error-messages';
import {WithPagination} from '~/types';
import {ScrapedEventData} from '../scraping';
import {EventImageService} from '../scraping/image-service';
import {logger, generateUniqueSlug} from '~/utils';
import {VenuesService} from '../venues';
import {GooglePlacesService} from '../google-places';

export class EventsService {
  private readonly imageService = new EventImageService();
  private readonly venuesService: VenuesService;

  constructor(
    private readonly eventsRepository: EventsRepository,
    venuesRepository?: VenuesRepository,
  ) {
    // VenuesService is optional - if not provided, events will have null venueId
    if (venuesRepository) {
      const googlePlacesService = new GooglePlacesService();
      this.venuesService = new VenuesService(
        venuesRepository,
        googlePlacesService,
      );
    } else {
      // Create a dummy service that returns null
      this.venuesService = {
        findOrCreateVenue: async () => null,
        getDistinctCities: async () => [],
      } as unknown as VenuesService;
    }
  }

  async getAllEventsPaginated(
    args: WithPagination<{
      city?: string;
      region?: string;
      lat?: number;
      lng?: number;
      radiusKm?: number;
      dateFrom?: string;
      dateTo?: string;
      hasTickets?: boolean;
      tzOffset?: number;
    }>,
    userId?: string,
  ) {
    const paginatedEvents =
      await this.eventsRepository.findAllPaginatedWithImages(
        args.pagination,
        userId,
        {
          city: args.city,
          region: args.region,
          lat: args.lat,
          lng: args.lng,
          radiusKm: args.radiusKm,
          dateFrom: args.dateFrom,
          dateTo: args.dateTo,
          hasTickets: args.hasTickets,
          tzOffset: args.tzOffset,
        },
      );

    return paginatedEvents;
  }

  async storeScrapedEvents(events: ScrapedEventData[]) {
    if (events.length === 0) {
      return [];
    }

    // Strip free (faceValue === 0) ticket waves — these are guest-list entries
    // The event-level filter (all waves free / no waves) is done upstream in ScrapingService
    const eventsWithPaidWaves = events.map(event => ({
      ...event,
      ticketWaves: event.ticketWaves.filter(w => w.faceValue > 0),
    }));

    // Process venues for all events first (in parallel batches)
    const eventsWithVenues = await this.processVenuesForEvents(eventsWithPaidWaves);

    // Generate slugs for events
    const eventsWithSlugs = await this.generateSlugsForEvents(eventsWithVenues);

    const eventsWithoutImages = eventsWithSlugs.map(event => ({
      ...event,
      images: [],
    }));

    const upsertedEvents = await this.eventsRepository.upsertEventsBatch(
      eventsWithoutImages,
    );

    // Create a map from externalId to original event to handle cases where
    // some events failed to upsert (indices won't match)
    const originalEventsByExternalId = new Map(
      events.map(event => [event.externalId, event]),
    );

    await Promise.all(
      upsertedEvents.map(async upsertedEvent => {
        // Use externalId to find the original event instead of array index
        // This handles cases where upsertEventsBatch silently skips failed events
        const originalEvent = originalEventsByExternalId.get(
          upsertedEvent.externalId,
        );

        if (
          !originalEvent ||
          !originalEvent.images ||
          originalEvent.images.length === 0
        ) {
          return;
        }

        try {
          const processedImages = await this.imageService.processImages(
            originalEvent.images,
            upsertedEvent.id,
          );

          await this.eventsRepository.updateEventImages(
            upsertedEvent.id,
            processedImages.map(img => ({
              type: img.type,
              url: img.url,
              thumbnailUrl: img.thumbnailUrl,
            })),
          );
        } catch (error) {
          logger.error('Failed to process images for event', {
            error,
            eventId: upsertedEvent.id,
            externalId: upsertedEvent.externalId,
          });
        }
      }),
    );

    return upsertedEvents;
  }

  /**
   * Generate unique slugs for events that don't already have one in the DB.
   * Existing events (matched by externalId) keep their current slug on upsert.
   */
  private async generateSlugsForEvents(
    events: ScrapedEventData[],
  ): Promise<(ScrapedEventData & { slug: string })[]> {
    const results: (ScrapedEventData & { slug: string })[] = [];

    for (const event of events) {
      const slug = await generateUniqueSlug(
        event.name,
        (candidate) => this.eventsRepository.slugExists(candidate),
      );
      results.push({ ...event, slug });
    }

    return results;
  }

  /**
   * Process venues for all events in parallel batches
   * Creates venues if they don't exist and returns events with venueId populated
   */
  private async processVenuesForEvents(
    events: ScrapedEventData[],
  ): Promise<ScrapedEventData[]> {
    const BATCH_SIZE = 5; // Process 5 events at a time to avoid rate limiting
    const results: ScrapedEventData[] = [];

    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = events.slice(i, i + BATCH_SIZE);

      const processedBatch = await Promise.all(
        batch.map(async event => {
          try {
            const venueId = await this.venuesService.findOrCreateVenue(
              event.scrapedVenueName,
              event.scrapedVenueAddress,
              event.scrapedVenueLatitude,
              event.scrapedVenueLongitude,
            );

            return {
              ...event,
              venueId: venueId ?? undefined,
            };
          } catch (error) {
            logger.error('Failed to process venue for event', {
              error,
              eventName: event.name,
              externalId: event.externalId,
            });
            // Return event without venueId on error
            return event;
          }
        }),
      );

      results.push(...processedBatch);
    }

    return results;
  }

  /**
   * Cleanup stale events for a specific platform.
   * Only deletes events from this platform that are no longer in scraped results.
   * Includes a ratio safety check to prevent mass deletion from partial scrapes.
   */
  async cleanupStaleEventsForPlatform(
    platform: string,
    scrapedEvents: ScrapedEventData[],
  ) {
    const now = new Date();
    const scrapedExternalIds = scrapedEvents.map(event => event.externalId);

    // Safety check: don't proceed if no scraped events
    if (scrapedExternalIds.length === 0) {
      logger.warn(
        `No scraped events for ${platform} - skipping cleanup to prevent data loss`,
      );
      return [];
    }

    // Ratio safety check: compare scraped count against active DB count
    const activeCount =
      await this.eventsRepository.getActiveEventCountByPlatform(platform);

    if (activeCount > 0) {
      const ratio = scrapedExternalIds.length / activeCount;
      const minRatio = parseFloat(
        process.env.SCRAPER_CLEANUP_MIN_RATIO || '0.5',
      );

      if (ratio < minRatio) {
        logger.warn(
          `Ratio check failed for ${platform}: scraped ${scrapedExternalIds.length} vs ${activeCount} active (ratio=${ratio.toFixed(2)}, threshold=${minRatio}). Skipping cleanup.`,
        );
        return [];
      }
    }

    try {
      const batchSize = 100;
      let deletedNotInScraped: Array<{
        id: string;
        externalId: string;
        name: string;
      }> = [];

      if (scrapedExternalIds.length > 1000) {
        // Large dataset: use batching
        const existingExternalIds =
          await this.eventsRepository.getAllActiveEventExternalIdsForPlatform(
            platform,
          );
        const eventsToDelete = existingExternalIds.filter(
          existingId => !scrapedExternalIds.includes(existingId),
        );

        if (eventsToDelete.length > 0) {
          logger.info(
            `Found ${eventsToDelete.length} ${platform} events to delete (not in scraped results)`,
          );

          for (let i = 0; i < eventsToDelete.length; i += batchSize) {
            const batch = eventsToDelete.slice(i, i + batchSize);
            const batchResult =
              await this.eventsRepository.softDeleteEventsByExternalIds(
                batch,
                now,
              );
            deletedNotInScraped.push(...batchResult);
          }
        }
      } else {
        // Small to medium dataset: efficient database-side comparison
        deletedNotInScraped =
          await this.eventsRepository.softDeleteEventsNotInScrapedResultsForPlatform(
            platform,
            scrapedExternalIds,
            now,
          );
      }

      if (deletedNotInScraped.length > 0) {
        logger.info(
          `Soft deleted ${deletedNotInScraped.length} ${platform} events no longer in scraped results`,
        );

        // Soft delete related ticket waves
        await this.softDeleteRelatedTicketWaves(
          deletedNotInScraped.map(event => event.id),
          now,
        );
      }

      return deletedNotInScraped;
    } catch (error) {
      logger.error(`Error during ${platform} cleanup:`, error);
      throw error;
    }
  }

  /**
   * Cleanup events with past end dates (platform-independent, always runs).
   */
  async cleanupPastEvents() {
    const now = new Date();

    try {
      const deletedPastEvents =
        await this.eventsRepository.softDeleteEventsWithPastEndDates(now);

      if (deletedPastEvents.length > 0) {
        logger.info(
          `Soft deleted ${deletedPastEvents.length} events with past end dates`,
        );

        await this.softDeleteRelatedTicketWaves(
          deletedPastEvents.map(event => event.id),
          now,
        );
      }

      return deletedPastEvents;
    } catch (error) {
      logger.error('Error during past events cleanup:', error);
      throw error;
    }
  }

  // Helper method to soft delete related ticket waves
  private async softDeleteRelatedTicketWaves(
    eventIds: string[],
    deletedAt: Date,
  ) {
    if (eventIds.length === 0) return;

    const batchSize = 100;

    // Process ticket wave deletions in batches to avoid large IN clauses
    for (let i = 0; i < eventIds.length; i += batchSize) {
      const batchIds = eventIds.slice(i, i + batchSize);

      await this.eventsRepository.softDeleteRelatedTicketWaves(
        batchIds,
        deletedAt,
      );
    }
  }

  async getEventById(eventId: string, userId?: string) {
    const event = await this.eventsRepository.getById(eventId, userId);
    if (!event) {
      throw new NotFoundError(EVENT_ERROR_MESSAGES.EVENT_NOT_FOUND);
    }
    return event;
  }

  async getEventBySlug(slug: string, userId?: string) {
    const event = await this.eventsRepository.findBySlug(slug, userId);
    if (!event) {
      throw new NotFoundError(EVENT_ERROR_MESSAGES.EVENT_NOT_FOUND);
    }
    return event;
  }

  async getBySearch(query: string, limit: number = 20) {
    if (!query || query.trim().length === 0) {
      return this.eventsRepository.getUpcomingEvents(8);
    }

    return this.eventsRepository.getBySearch(query.trim(), limit);
  }

  /**
   * Get distinct cities for filter dropdown
   */
  async getDistinctCities() {
    return this.venuesService.getDistinctCities();
  }
}
