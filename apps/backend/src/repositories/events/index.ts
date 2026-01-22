import { type Kysely, type Updateable } from 'kysely';
import type { DB, EventImageType, Events } from '@revendiste/shared';
import type { ScrapedEventData } from '../../services/scraping';
import { logger } from '~/utils';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { mapToPaginatedResponse } from '~/middleware';
import { NotFoundError } from '~/errors';
import { sql } from 'kysely';
import { BaseRepository } from '../base';
import type { PaginationOptions } from '~/types/pagination';
import { getStorageProvider } from '~/services';

export class EventsRepository extends BaseRepository<EventsRepository> {
  withTransaction(trx: Kysely<DB>): EventsRepository {
    return new EventsRepository(trx);
  }

  // Upsert event with all related data in a single transaction
  async upsertScrapedEvent(event: ScrapedEventData) {
    return await this.db.transaction().execute(async trx => {
      const now = new Date();

      // Check if event was previously soft-deleted (for logging purposes)
      const existingEvent = await trx
        .selectFrom('events')
        .select(['id', 'deletedAt'])
        .where('externalId', '=', event.externalId)
        .executeTakeFirst();

      const wasDeleted = existingEvent?.deletedAt !== null && existingEvent?.deletedAt !== undefined;

      // Upsert the main event
      const [upsertedEvent] = await trx
        .insertInto('events')
        .values({
          externalId: event.externalId,
          platform: event.platform,
          name: event.name,
          description: event.description || null,
          eventStartDate: event.eventStartDate,
          eventEndDate: event.eventEndDate,
          venueId: event.venueId || null,
          externalUrl: event.externalUrl,
          qrAvailabilityTiming: event.qrAvailabilityTiming || null,
          status: 'active',
          createdAt: now,
          updatedAt: now,
          lastScrapedAt: now,
        })
        .onConflict(oc =>
          oc.column('externalId').doUpdateSet({
            name: event.name,
            description: event.description || null,
            eventStartDate: event.eventStartDate,
            eventEndDate: event.eventEndDate,
            venueId: event.venueId || null,
            externalUrl: event.externalUrl,
            qrAvailabilityTiming: event.qrAvailabilityTiming || null,
            status: 'active',
            // Clear deletedAt to restore soft-deleted events that reappear in scraped results
            deletedAt: null,
            updatedAt: now,
            lastScrapedAt: now,
          }),
        )
        .returningAll()
        .execute();

      // Upsert images by eventId and imageType
      if (event.images.length > 0) {
        for (const image of event.images) {
          await trx
            .insertInto('eventImages')
            .values({
              eventId: upsertedEvent.id,
              imageType: image.type,
              url: image.url,
              displayOrder: event.images.indexOf(image),
              createdAt: now,
            })
            .onConflict(oc =>
              oc.columns(['eventId', 'imageType']).doUpdateSet({
                url: image.url,
                displayOrder: event.images.indexOf(image),
                createdAt: now,
              }),
            )
            .execute();
        }
      }

      // Log if we restored a previously deleted event
      if (wasDeleted) {
        logger.info('Restored previously soft-deleted event', {
          eventId: upsertedEvent.id,
          externalId: upsertedEvent.externalId,
          name: upsertedEvent.name,
        });
      }

      // Upsert ticket waves by eventId and externalId (composite unique constraint)
      // Note: externalId is NOT globally unique - it can be reused across different events
      // We use the composite key (eventId, externalId) for conflict resolution
      if (event.ticketWaves.length > 0) {
        for (const ticketWave of event.ticketWaves) {
          await trx
            .insertInto('eventTicketWaves')
            .values({
              eventId: upsertedEvent.id,
              externalId: ticketWave.externalId,
              name: ticketWave.name,
              description: ticketWave.description || null,
              faceValue: ticketWave.faceValue,
              currency: ticketWave.currency,
              isSoldOut: ticketWave.isSoldOut,
              isAvailable: ticketWave.isAvailable,
              status: 'active',
              metadata: ticketWave.metadata || null,
              createdAt: now,
              updatedAt: now,
              lastScrapedAt: now,
            })
            .onConflict(oc =>
              oc.columns(['eventId', 'externalId']).doUpdateSet({
                name: ticketWave.name,
                description: ticketWave.description || null,
                faceValue: ticketWave.faceValue,
                currency: ticketWave.currency,
                isSoldOut: ticketWave.isSoldOut,
                isAvailable: ticketWave.isAvailable,
                status: 'active',
                // Clear deletedAt to restore soft-deleted ticket waves that reappear
                deletedAt: null,
                metadata: ticketWave.metadata || null,
                updatedAt: now,
                lastScrapedAt: now,
              }),
            )
            .execute();
        }
      }

      return upsertedEvent;
    });
  }

  // Batch process events - each event in its own transaction
  async upsertEventsBatch(events: ScrapedEventData[]) {
    if (events.length === 0) {
      return [];
    }

    const results = [];

    // Process each event individually to maintain transaction integrity
    for (const event of events) {
      try {
        const result = await this.upsertScrapedEvent(event);
        results.push(result);
      } catch (error) {
        console.log(error);
        // Log error but continue processing other events
        logger.error(`Failed to upsert event ${event.externalId}:`, error);
      }
    }

    return results;
  }

  async updateEventImages(
    eventId: string,
    images: Array<{ type: EventImageType; url: string }>,
  ) {
    return await this.db.transaction().execute(async trx => {
      const now = new Date();

      for (const image of images) {
        await trx
          .insertInto('eventImages')
          .values({
            eventId,
            imageType: image.type,
            url: image.url,
            displayOrder: images.indexOf(image),
            createdAt: now,
          })
          .onConflict(oc =>
            oc.columns(['eventId', 'imageType']).doUpdateSet({
              url: image.url,
              displayOrder: images.indexOf(image),
            }),
          )
          .execute();
      }
    });
  }

  // Retrieve paginated events with images using jsonArrayFrom
  async findAllPaginatedWithImages(
    pagination: PaginationOptions,
    userId?: string,
    filters?: {city?: string},
  ) {
    const { page, limit, offset, sortBy, sortOrder } = pagination;

    // Get total count
    let countQuery = this.db
      .selectFrom('events')
      .select(this.db.fn.count('events.id').as('total'))
      .where('events.deletedAt', 'is', null)
      .where('events.status', '=', 'active');

    // Apply city filter to count if provided
    if (filters?.city) {
      countQuery = countQuery
        .innerJoin('eventVenues', 'eventVenues.id', 'events.venueId')
        .where('eventVenues.city', '=', filters.city);
    }

    const totalResult = await countQuery.executeTakeFirst();
    const total = Number(totalResult?.total || 0);

    // Get events with nested images using jsonArrayFrom
    // Join with eventVenues to get venue info
    const events = await this.db
      .selectFrom('events')
      .leftJoin('eventVenues', 'eventVenues.id', 'events.venueId')
      .select(eb => [
        'events.id',
        'events.name',
        'events.description',
        'events.eventStartDate',
        'events.eventEndDate',
        'eventVenues.name as venueName',
        'eventVenues.address as venueAddress',
        'eventVenues.city as venueCity',
        'events.externalUrl',
        'events.status',
        'events.createdAt',
        'events.updatedAt',
        // Get lowest available ticket price
        userId
          ? sql<number | null>`
              (
                SELECT listing_tickets.price
                FROM listing_tickets
                INNER JOIN listings ON listings.id = listing_tickets.listing_id
                INNER JOIN event_ticket_waves ON event_ticket_waves.id = listings.ticket_wave_id
                LEFT JOIN order_ticket_reservations ON 
                  order_ticket_reservations.listing_ticket_id = listing_tickets.id
                  AND order_ticket_reservations.deleted_at IS NULL
                  AND order_ticket_reservations.reserved_until > NOW()
                WHERE event_ticket_waves.event_id = events.id
                  AND listing_tickets.sold_at IS NULL
                  AND listing_tickets.deleted_at IS NULL
                  AND listings.deleted_at IS NULL
                  AND order_ticket_reservations.id IS NULL
                  AND listings.publisher_user_id != ${userId}
                ORDER BY listing_tickets.price ASC
                LIMIT 1
              )
            `.as('lowestAvailableTicketPrice')
          : sql<number | null>`
              (
                SELECT listing_tickets.price
                FROM listing_tickets
                INNER JOIN listings ON listings.id = listing_tickets.listing_id
                INNER JOIN event_ticket_waves ON event_ticket_waves.id = listings.ticket_wave_id
                LEFT JOIN order_ticket_reservations ON 
                  order_ticket_reservations.listing_ticket_id = listing_tickets.id
                  AND order_ticket_reservations.deleted_at IS NULL
                  AND order_ticket_reservations.reserved_until > NOW()
                WHERE event_ticket_waves.event_id = events.id
                  AND listing_tickets.sold_at IS NULL
                  AND listing_tickets.deleted_at IS NULL
                  AND listings.deleted_at IS NULL
                  AND order_ticket_reservations.id IS NULL
                ORDER BY listing_tickets.price ASC
                LIMIT 1
              )
            `.as('lowestAvailableTicketPrice'),
        // Get currency from the same ticket (same subquery logic)
        userId
          ? sql<string | null>`
              (
                SELECT event_ticket_waves.currency
                FROM listing_tickets
                INNER JOIN listings ON listings.id = listing_tickets.listing_id
                INNER JOIN event_ticket_waves ON event_ticket_waves.id = listings.ticket_wave_id
                LEFT JOIN order_ticket_reservations ON 
                  order_ticket_reservations.listing_ticket_id = listing_tickets.id
                  AND order_ticket_reservations.deleted_at IS NULL
                  AND order_ticket_reservations.reserved_until > NOW()
                WHERE event_ticket_waves.event_id = events.id
                  AND listing_tickets.sold_at IS NULL
                  AND listing_tickets.deleted_at IS NULL
                  AND listings.deleted_at IS NULL
                  AND order_ticket_reservations.id IS NULL
                  AND listings.publisher_user_id != ${userId}
                ORDER BY listing_tickets.price ASC
                LIMIT 1
              )
            `.as('lowestAvailableTicketCurrency')
          : sql<string | null>`
              (
                SELECT event_ticket_waves.currency
                FROM listing_tickets
                INNER JOIN listings ON listings.id = listing_tickets.listing_id
                INNER JOIN event_ticket_waves ON event_ticket_waves.id = listings.ticket_wave_id
                LEFT JOIN order_ticket_reservations ON 
                  order_ticket_reservations.listing_ticket_id = listing_tickets.id
                  AND order_ticket_reservations.deleted_at IS NULL
                  AND order_ticket_reservations.reserved_until > NOW()
                WHERE event_ticket_waves.event_id = events.id
                  AND listing_tickets.sold_at IS NULL
                  AND listing_tickets.deleted_at IS NULL
                  AND listings.deleted_at IS NULL
                  AND order_ticket_reservations.id IS NULL
                ORDER BY listing_tickets.price ASC
                LIMIT 1
              )
            `.as('lowestAvailableTicketCurrency'),
        jsonArrayFrom(
          eb
            .selectFrom('eventImages')
            .select(['eventImages.url', 'eventImages.imageType'])
            .whereRef('eventImages.eventId', '=', 'events.id')
            .orderBy('eventImages.displayOrder'),
        ).as('images'),
      ])
      .where('events.deletedAt', 'is', null)
      .where('events.status', '=', 'active')
      .$if(!!filters?.city, qb => qb.where('eventVenues.city', '=', filters!.city!))
      .orderBy('events.eventStartDate', 'asc')
      .limit(limit)
      .offset(offset)
      .execute();

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return mapToPaginatedResponse(events, {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    });
  }

  // Soft delete events by external IDs (for events not in scraped results)
  async softDeleteEventsByExternalIds(externalIds: string[], deletedAt: Date) {
    const result = await this.db
      .updateTable('events')
      .set({
        deletedAt: deletedAt,
        status: 'inactive',
        updatedAt: deletedAt,
      })
      .where('deletedAt', 'is', null)
      .where('externalId', 'in', externalIds)
      .returning(['id', 'externalId', 'name'])
      .execute();

    return result;
  }

  // Soft delete events with past end dates
  async softDeleteEventsWithPastEndDates(deletedAt: Date) {
    const result = await this.db
      .updateTable('events')
      .set({
        deletedAt: deletedAt,
        status: 'inactive',
        updatedAt: deletedAt,
      })
      .where('deletedAt', 'is', null)
      .where('eventEndDate', '<', deletedAt)
      .returning(['id', 'externalId', 'name'])
      .execute();

    return result;
  }

  // Get all active event external IDs (for comparison with scraped results)
  async getAllActiveEventExternalIds() {
    const result = await this.db
      .selectFrom('events')
      .select('externalId')
      .where('deletedAt', 'is', null)
      .where('status', '=', 'active')
      .execute();

    return result.map(row => row.externalId);
  }

  // More efficient: Soft delete events not in scraped results using database-side comparison
  async softDeleteEventsNotInScrapedResults(
    scrapedExternalIds: string[],
    deletedAt: Date,
  ) {
    // Use NOT EXISTS with a subquery for better performance with large datasets
    const result = await this.db
      .updateTable('events')
      .set({
        deletedAt: deletedAt,
        status: 'inactive',
        updatedAt: deletedAt,
      })
      .where('deletedAt', 'is', null)
      .where(eb =>
        eb.not(
          eb.exists(
            eb
              .selectFrom('events as e2')
              .select('e2.externalId')
              .whereRef('e2.externalId', '=', 'events.externalId')
              .where('e2.externalId', 'in', scrapedExternalIds),
          ),
        ),
      )
      .returning(['id', 'externalId', 'name'])
      .execute();

    return result;
  }

  // Helper method to soft delete related ticket waves
  async softDeleteRelatedTicketWaves(eventIds: string[], deletedAt: Date) {
    if (eventIds.length === 0) return;

    const batchSize = 100;

    // Process ticket wave deletions in batches to avoid large IN clauses
    for (let i = 0; i < eventIds.length; i += batchSize) {
      const batchIds = eventIds.slice(i, i + batchSize);

      await this.db
        .updateTable('eventTicketWaves')
        .set({
          deletedAt: deletedAt,
          status: 'inactive',
          updatedAt: deletedAt,
        })
        .where('deletedAt', 'is', null)
        .where('eventId', 'in', batchIds)
        .execute();
    }
  }

  // Retrieve event information with ticket waves and images
  async getById(eventId: string, userId?: string) {
    const event = await this.db
      .selectFrom('events')
      .leftJoin('eventVenues', 'eventVenues.id', 'events.venueId')
      .select(eb => [
        'events.id',
        'events.name',
        'events.description',
        'events.eventStartDate',
        'events.eventEndDate',
        'eventVenues.name as venueName',
        'eventVenues.address as venueAddress',
        'eventVenues.city as venueCity',
        'events.externalUrl',
        'events.qrAvailabilityTiming',
        'events.status',
        'events.createdAt',
        'events.updatedAt',
        // Count of current user's listings for this event (to show contextual messaging)
        userId
          ? sql<number>`
              (
                SELECT COUNT(DISTINCT listings.id)::int
                FROM listings
                INNER JOIN event_ticket_waves ON event_ticket_waves.id = listings.ticket_wave_id
                WHERE event_ticket_waves.event_id = events.id
                  AND listings.publisher_user_id = ${userId}
                  AND listings.deleted_at IS NULL
              )
            `.as('userListingsCount')
          : sql<number>`0`.as('userListingsCount'),
        jsonArrayFrom(
          eb
            .selectFrom('eventImages')
            .select(['eventImages.url', 'eventImages.imageType'])
            .whereRef('eventImages.eventId', '=', 'events.id')
            .orderBy('eventImages.displayOrder'),
        ).as('eventImages'),
        jsonArrayFrom(
          eb
            .selectFrom('eventTicketWaves')
            .select(eb => [
              'eventTicketWaves.id',
              'eventTicketWaves.name',
              'eventTicketWaves.currency',
              'eventTicketWaves.description',
              'eventTicketWaves.faceValue',
              jsonArrayFrom(
                eb
                  .selectFrom('listingTickets')
                  .innerJoin(
                    'listings',
                    'listings.id',
                    'listingTickets.listingId',
                  )
                  .leftJoin('orderTicketReservations', join =>
                    join
                      .onRef(
                        'orderTicketReservations.listingTicketId',
                        '=',
                        'listingTickets.id',
                      )
                      .on('orderTicketReservations.deletedAt', 'is', null)
                      .on(
                        'orderTicketReservations.reservedUntil',
                        '>',
                        new Date(),
                      ),
                  )
                  .select(eb => [
                    'listingTickets.price',
                    eb.fn.count('listingTickets.id').as('availableTickets'),
                  ])
                  .where('listingTickets.soldAt', 'is', null)
                  .where('listingTickets.deletedAt', 'is', null)
                  .where('listings.deletedAt', 'is', null)
                  .where('orderTicketReservations.id', 'is', null) // Not reserved
                  .$if(!!userId, eb =>
                    eb.where('listings.publisherUserId', '!=', userId!),
                  )
                  .whereRef('listings.ticketWaveId', '=', 'eventTicketWaves.id')
                  .groupBy('listingTickets.price')
                  .orderBy('listingTickets.price', 'asc'),
              ).as('priceGroups'),
            ])
            .whereRef('eventTicketWaves.eventId', '=', 'events.id')
            .orderBy('eventTicketWaves.faceValue', 'asc'),
        ).as('ticketWaves'),
      ])
      .where('events.id', '=', eventId)
      .where('events.deletedAt', 'is', null)
      .where('events.status', '=', 'active')
      .orderBy('events.eventStartDate', 'asc')
      .executeTakeFirst();

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return event;
  }

  // Get upcoming events ordered by start date (includes in-progress events)
  async getUpcomingEvents(limit: number = 8) {
    const now = new Date();

    const events = await this.db
      .selectFrom('events')
      .leftJoin('eventVenues', 'eventVenues.id', 'events.venueId')
      .select(eb => [
        'events.id',
        'events.name',
        'events.description',
        'events.eventStartDate',
        'events.eventEndDate',
        'eventVenues.name as venueName',
        'eventVenues.address as venueAddress',
        'eventVenues.city as venueCity',
        'events.externalUrl',
        'events.status',
        'events.createdAt',
        'events.updatedAt',
        // Only include flyer images for the search results
        jsonArrayFrom(
          eb
            .selectFrom('eventImages')
            .select(['eventImages.url', 'eventImages.imageType'])
            .whereRef('eventImages.eventId', '=', 'events.id')
            .where('eventImages.imageType', '=', 'flyer')
            .orderBy('eventImages.displayOrder'),
        ).as('eventImages'),
      ])
      .where('events.deletedAt', 'is', null)
      .where('events.status', '=', 'active')
      .where('events.eventEndDate', '>', now) // Include events that haven't ended yet
      .orderBy('events.eventStartDate', 'asc')
      .limit(limit)
      .execute();

    return events;
  }

  // Search events by name using ILIKE for substring matching and trigram similarity for fuzzy matching
  // Only returns events that haven't ended yet (includes in-progress events)
  async getBySearch(query: string, limit: number = 20) {
    const searchPattern = `%${query}%`;
    const now = new Date();

    const events = await this.db
      .selectFrom('events')
      .leftJoin('eventVenues', 'eventVenues.id', 'events.venueId')
      .select(eb => [
        'events.id',
        'events.name',
        'events.description',
        'events.eventStartDate',
        'events.eventEndDate',
        'eventVenues.name as venueName',
        'eventVenues.address as venueAddress',
        'eventVenues.city as venueCity',
        'events.externalUrl',
        'events.status',
        'events.createdAt',
        'events.updatedAt',
        // Only include flyer images for the search results
        jsonArrayFrom(
          eb
            .selectFrom('eventImages')
            .select(['eventImages.url', 'eventImages.imageType'])
            .whereRef('eventImages.eventId', '=', 'events.id')
            .where('eventImages.imageType', '=', 'flyer')
            .orderBy('eventImages.displayOrder'),
        ).as('eventImages'),
      ])
      .where('events.deletedAt', 'is', null)
      .where('events.status', '=', 'active')
      .where('events.eventEndDate', '>', now) // Only include events that haven't ended yet
      // Use ILIKE for substring matching (works for partial word matches like "fideles" in "WAVES OF LIFE w/ FIDELES PDE 2026")
      // Also use trigram similarity for fuzzy matching (handles typos and variations)
      .where(
        eb =>
          sql`(events.name ILIKE ${searchPattern} OR similarity(events.name, ${query}) > 0.2)`,
      )
      // Order by relevance: exact matches first, then ILIKE matches, then similarity score, then date
      .orderBy(
        eb =>
          sql`CASE 
          WHEN events.name ILIKE ${query} THEN 0
          WHEN events.name ILIKE ${searchPattern} THEN 1
          ELSE 2
        END`,
      )
      .orderBy(eb => sql`similarity(events.name, ${query}) DESC`)
      .orderBy('events.eventStartDate', 'asc')
      .limit(limit)
      .execute();

    return events;
  }

  // ============================================================================
  // Admin Methods
  // ============================================================================

  /**
   * Get all events for admin with pagination, sorting, and filtering
   * By default excludes past events (eventEndDate < now)
   */
  async findAllForAdmin(
    pagination: PaginationOptions,
    filters: {
      includePast?: boolean;
      search?: string;
      status?: 'active' | 'inactive';
    } = {},
  ) {
    const { page, limit, offset } = pagination;
    const now = new Date();

    // Build count query
    let countQuery = this.db
      .selectFrom('events')
      .select(this.db.fn.count('id').as('total'))
      .where('deletedAt', 'is', null);

    // Apply filters to count
    if (!filters.includePast) {
      countQuery = countQuery.where('eventEndDate', '>', now);
    }
    if (filters.status) {
      countQuery = countQuery.where('status', '=', filters.status);
    }
    if (filters.search) {
      const searchPattern = `%${filters.search}%`;
      countQuery = countQuery.where('name', 'ilike', searchPattern);
    }

    const totalResult = await countQuery.executeTakeFirst();
    const total = Number(totalResult?.total || 0);

    // Build main query
    let query = this.db
      .selectFrom('events')
      .leftJoin('eventVenues', 'eventVenues.id', 'events.venueId')
      .select(eb => [
        'events.id',
        'events.name',
        'events.description',
        'events.eventStartDate',
        'events.eventEndDate',
        'eventVenues.name as venueName',
        'eventVenues.address as venueAddress',
        'eventVenues.city as venueCity',
        'events.externalUrl',
        'events.externalId',
        'events.platform',
        'events.qrAvailabilityTiming',
        'events.status',
        'events.createdAt',
        'events.updatedAt',
        jsonArrayFrom(
          eb
            .selectFrom('eventImages')
            .select([
              'eventImages.id',
              'eventImages.url',
              'eventImages.imageType',
              'eventImages.displayOrder',
            ])
            .whereRef('eventImages.eventId', '=', 'events.id')
            .where('eventImages.deletedAt', 'is', null)
            .orderBy('eventImages.displayOrder'),
        ).as('images'),
        jsonArrayFrom(
          eb
            .selectFrom('eventTicketWaves')
            .select([
              'eventTicketWaves.id',
              'eventTicketWaves.name',
              'eventTicketWaves.description',
              'eventTicketWaves.faceValue',
              'eventTicketWaves.currency',
              'eventTicketWaves.isSoldOut',
              'eventTicketWaves.isAvailable',
              'eventTicketWaves.externalId',
              'eventTicketWaves.status',
            ])
            .whereRef('eventTicketWaves.eventId', '=', 'events.id')
            .where('eventTicketWaves.deletedAt', 'is', null)
            .orderBy('eventTicketWaves.faceValue', 'asc'),
        ).as('ticketWaves'),
      ])
      .where('events.deletedAt', 'is', null);

    // Apply filters
    if (!filters.includePast) {
      query = query.where('events.eventEndDate', '>', now);
    }
    if (filters.status) {
      query = query.where('events.status', '=', filters.status);
    }
    if (filters.search) {
      const searchPattern = `%${filters.search}%`;
      query = query.where('events.name', 'ilike', searchPattern);
    }

    // Sort by eventStartDate ascending (closest events first)
    const events = await query
      .orderBy('events.eventStartDate', 'asc')
      .limit(limit)
      .offset(offset)
      .execute();

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return mapToPaginatedResponse(events, {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    });
  }

  /**
   * Get event by ID for admin (includes all details, even inactive)
   */
  async getByIdForAdmin(eventId: string) {
    const event = await this.db
      .selectFrom('events')
      .leftJoin('eventVenues', 'eventVenues.id', 'events.venueId')
      .select(eb => [
        'events.id',
        'events.name',
        'events.description',
        'events.eventStartDate',
        'events.eventEndDate',
        'eventVenues.name as venueName',
        'eventVenues.address as venueAddress',
        'eventVenues.city as venueCity',
        'events.externalUrl',
        'events.externalId',
        'events.platform',
        'events.qrAvailabilityTiming',
        'events.status',
        'events.metadata',
        'events.createdAt',
        'events.updatedAt',
        'events.lastScrapedAt',
        jsonArrayFrom(
          eb
            .selectFrom('eventImages')
            .select([
              'eventImages.id',
              'eventImages.url',
              'eventImages.imageType',
              'eventImages.displayOrder',
              'eventImages.createdAt',
            ])
            .whereRef('eventImages.eventId', '=', 'events.id')
            .where('eventImages.deletedAt', 'is', null)
            .orderBy('eventImages.displayOrder'),
        ).as('images'),
        jsonArrayFrom(
          eb
            .selectFrom('eventTicketWaves')
            .select([
              'eventTicketWaves.id',
              'eventTicketWaves.name',
              'eventTicketWaves.description',
              'eventTicketWaves.faceValue',
              'eventTicketWaves.currency',
              'eventTicketWaves.isSoldOut',
              'eventTicketWaves.isAvailable',
              'eventTicketWaves.externalId',
              'eventTicketWaves.status',
              'eventTicketWaves.createdAt',
              'eventTicketWaves.updatedAt',
            ])
            .whereRef('eventTicketWaves.eventId', '=', 'events.id')
            .where('eventTicketWaves.deletedAt', 'is', null)
            .orderBy('eventTicketWaves.faceValue', 'asc'),
        ).as('ticketWaves'),
      ])
      .where('events.id', '=', eventId)
      .where('events.deletedAt', 'is', null)
      .executeTakeFirst();

    if (!event) {
      throw new NotFoundError('Evento no encontrado');
    }

    return event;
  }

  /**
   * Update event fields
   */
  async updateEvent(eventId: string, data: Updateable<Events>) {
    const updateData: Updateable<Events> = {
      ...data,
      updatedAt: new Date(),
    };

    const [updated] = await this.db
      .updateTable('events')
      .set(updateData)
      .where('id', '=', eventId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .execute();

    if (!updated) {
      throw new NotFoundError('Evento no encontrado');
    }

    return updated;
  }

  /**
   * Soft delete event
   */
  async softDeleteEvent(eventId: string) {
    const now = new Date();

    const [deleted] = await this.db
      .updateTable('events')
      .set({
        deletedAt: now,
        status: 'inactive',
        updatedAt: now,
      })
      .where('id', '=', eventId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .execute();

    if (!deleted) {
      throw new NotFoundError('Evento no encontrado');
    }

    // Also soft delete related ticket waves
    await this.db
      .updateTable('eventTicketWaves')
      .set({
        deletedAt: now,
        status: 'inactive',
        updatedAt: now,
      })
      .where('eventId', '=', eventId)
      .where('deletedAt', 'is', null)
      .execute();

    return deleted;
  }

  /**
   * Get distinct cities from eventVenues for active events
   * Returns list of cities that have active events
   */
  async getDistinctCities(): Promise<string[]> {
    const cities = await this.db
      .selectFrom('eventVenues')
      .innerJoin('events', 'events.venueId', 'eventVenues.id')
      .select('eventVenues.city')
      .where('events.deletedAt', 'is', null)
      .where('events.status', '=', 'active')
      .where('events.eventEndDate', '>', new Date())
      .where('eventVenues.deletedAt', 'is', null)
      .distinct()
      .orderBy('eventVenues.city', 'asc')
      .execute();

    return cities.map(c => c.city);
  }
}
