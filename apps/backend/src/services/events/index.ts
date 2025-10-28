import {EventsRepository} from '~/repositories';
import {WithPagination} from '~/types';
import {ScrapedEventData} from '../scraping';
import {logger} from '~/utils';

export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async getAllEventsPaginated(args: WithPagination<{}>) {
    return this.eventsRepository.findAllPaginatedWithImages(args.pagination);
  }

  async storeScrapedEvents(events: ScrapedEventData[]) {
    if (events.length === 0) {
      return [];
    }

    // Use the repository's batch method that handles transactions for each event
    return await this.eventsRepository.upsertEventsBatch(events);
  }

  async cleanupStaleEvents(scrapedEvents: ScrapedEventData[]) {
    const now = new Date();
    let totalDeleted = 0;
    const allDeletedEvents = [];
    const batchSize = 100; // Process in batches to avoid large IN clauses

    try {
      // Get external IDs from scraped events
      const scrapedExternalIds = scrapedEvents.map(event => event.externalId);

      // Safety check: don't proceed if no scraped events (scraping may have failed)
      if (scrapedExternalIds.length === 0) {
        logger.warn(
          'No scraped events found - skipping cleanup to prevent data loss',
        );
        return [];
      }

      // Choose approach based on dataset size
      let deletedNotInScraped: Array<{
        id: string;
        externalId: string;
        name: string;
      }> = [];

      if (scrapedExternalIds.length > 1000) {
        // Large dataset: use batching to avoid overwhelming the database
        logger.info('Large dataset detected, using batched deletion approach');

        const existingExternalIds =
          await this.eventsRepository.getAllActiveEventExternalIds();
        const eventsToDelete = existingExternalIds.filter(
          existingId => !scrapedExternalIds.includes(existingId),
        );

        if (eventsToDelete.length > 0) {
          logger.info(
            `Found ${eventsToDelete.length} events to delete (not in scraped results)`,
          );

          // Process deletions in batches to avoid large IN clauses
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
        // Small to medium dataset: use efficient database-side comparison
        // No batching needed for small datasets - single query is faster
        logger.info(
          'Small dataset detected, using efficient database-side comparison',
        );
        deletedNotInScraped =
          await this.eventsRepository.softDeleteEventsNotInScrapedResults(
            scrapedExternalIds,
            now,
          );
      }

      allDeletedEvents.push(...deletedNotInScraped);
      totalDeleted += deletedNotInScraped.length;

      if (deletedNotInScraped.length > 0) {
        logger.info(
          `Soft deleted ${deletedNotInScraped.length} events no longer in scraped results`,
        );
      }

      // Soft delete events with past end dates
      const deletedPastEvents =
        await this.eventsRepository.softDeleteEventsWithPastEndDates(now);
      allDeletedEvents.push(...deletedPastEvents);
      totalDeleted += deletedPastEvents.length;

      if (deletedPastEvents.length > 0) {
        logger.info(
          `Soft deleted ${deletedPastEvents.length} events with past end dates`,
        );
      }

      // Soft delete related ticket waves for all deleted events
      if (allDeletedEvents.length > 0) {
        await this.softDeleteRelatedTicketWaves(
          allDeletedEvents.map(event => event.id),
          now,
        );
      }

      logger.info(`Total events soft deleted: ${totalDeleted}`);
      return allDeletedEvents;
    } catch (error) {
      logger.error('Error during soft deletion process:', error);
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
    return this.eventsRepository.getById(eventId, userId);
  }

  async getBySearch(query: string, limit: number = 20) {
    if (!query || query.trim().length === 0) {
      return this.eventsRepository.getUpcomingEvents(8);
    }

    return this.eventsRepository.getBySearch(query.trim(), limit);
  }
}
