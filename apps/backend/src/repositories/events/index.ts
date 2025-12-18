import {type Kysely} from 'kysely';
import type {DB, EventImageType} from '@revendiste/shared';
import type {ScrapedEventData} from '../../services/scraping';
import {logger} from '~/utils';
import {jsonArrayFrom} from 'kysely/helpers/postgres';
import {mapToPaginatedResponse} from '~/middleware';
import {NotFoundError} from '~/errors';
import {sql} from 'kysely';
import {BaseRepository} from '../base';

export class EventsRepository extends BaseRepository<EventsRepository> {
  withTransaction(trx: Kysely<DB>): EventsRepository {
    return new EventsRepository(trx);
  }

  // Upsert event with all related data in a single transaction
  async upsertScrapedEvent(event: ScrapedEventData) {
    return await this.db.transaction().execute(async trx => {
      const now = new Date();

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
          venueName: event.venueName || null,
          venueAddress: event.venueAddress,
          externalUrl: event.externalUrl,
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
            venueName: event.venueName || null,
            venueAddress: event.venueAddress,
            externalUrl: event.externalUrl,
            status: 'active',
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
    images: Array<{type: EventImageType; url: string}>,
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
    pagination: {
      page: number;
      limit: number;
      offset: number;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
    },
    userId?: string,
  ) {
    const {page, limit, offset, sortBy, sortOrder} = pagination;

    // Get total count
    const totalResult = await this.db
      .selectFrom('events')
      .select(this.db.fn.count('id').as('total'))
      .where('deletedAt', 'is', null)
      .where('status', '=', 'active')
      .executeTakeFirst();

    const total = Number(totalResult?.total || 0);

    // Get events with nested images using jsonArrayFrom
    // Get lowest available ticket price and currency from the same ticket
    // Note: Using two identical subqueries - PostgreSQL's query planner will optimize this
    const events = await this.db
      .selectFrom('events')
      .select(eb => [
        'id',
        'name',
        'description',
        'eventStartDate',
        'eventEndDate',
        'venueName',
        'venueAddress',
        'externalUrl',
        'status',
        'createdAt',
        'updatedAt',
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
                  AND listing_tickets.cancelled_at IS NULL
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
                  AND listing_tickets.cancelled_at IS NULL
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
                  AND listing_tickets.cancelled_at IS NULL
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
                  AND listing_tickets.cancelled_at IS NULL
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
      .where('deletedAt', 'is', null)
      .where('status', '=', 'active')
      .orderBy('eventStartDate', 'asc')
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
      .select(eb => [
        'id',
        'name',
        'description',
        'eventStartDate',
        'eventEndDate',
        'venueName',
        'venueAddress',
        'externalUrl',
        'status',
        'createdAt',
        'updatedAt',
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
                  .where('listingTickets.cancelledAt', 'is', null)
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
      .where('id', '=', eventId)
      .where('deletedAt', 'is', null)
      .where('status', '=', 'active')
      .orderBy('eventStartDate', 'asc')
      .executeTakeFirst();

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return event;
  }

  // Get upcoming events ordered by start date
  async getUpcomingEvents(limit: number = 8) {
    const now = new Date();

    const events = await this.db
      .selectFrom('events')
      .select(eb => [
        'id',
        'name',
        'description',
        'eventStartDate',
        'eventEndDate',
        'venueName',
        'venueAddress',
        'externalUrl',
        'status',
        'createdAt',
        'updatedAt',
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
      .where('deletedAt', 'is', null)
      .where('status', '=', 'active')
      .where('eventStartDate', '>=', now)
      .orderBy('eventStartDate', 'asc')
      .limit(limit)
      .execute();

    return events;
  }

  // Search events by name using ILIKE for substring matching and trigram similarity for fuzzy matching
  async getBySearch(query: string, limit: number = 20) {
    const searchPattern = `%${query}%`;
    const events = await this.db
      .selectFrom('events')
      .select(eb => [
        'id',
        'name',
        'description',
        'eventStartDate',
        'eventEndDate',
        'venueName',
        'venueAddress',
        'externalUrl',
        'status',
        'createdAt',
        'updatedAt',
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
      .where('deletedAt', 'is', null)
      .where('status', '=', 'active')
      // Use ILIKE for substring matching (works for partial word matches like "fideles" in "WAVES OF LIFE w/ FIDELES PDE 2026")
      // Also use trigram similarity for fuzzy matching (handles typos and variations)
      .where(
        eb =>
          sql`(${eb.ref('name')} ILIKE ${searchPattern} OR similarity(${eb.ref(
            'name',
          )}, ${query}) > 0.2)`,
      )
      // Order by relevance: exact matches first, then ILIKE matches, then similarity score, then date
      .orderBy(
        eb =>
          sql`CASE 
          WHEN ${eb.ref('name')} ILIKE ${query} THEN 0
          WHEN ${eb.ref('name')} ILIKE ${searchPattern} THEN 1
          ELSE 2
        END`,
      )
      .orderBy(eb => sql`similarity(${eb.ref('name')}, ${query}) DESC`)
      .orderBy('eventStartDate', 'asc')
      .limit(limit)
      .execute();

    return events;
  }
}
