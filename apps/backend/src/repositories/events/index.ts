import {type Kysely} from 'kysely';
import type {DB} from '../../types/db';
import type {ScrapedEventData} from '../../services/scraping';
import {logger} from '~/utils';
import {jsonArrayFrom} from 'kysely/helpers/postgres';
import {mapToPaginatedResponse} from '~/middleware';
export class EventsRepository {
  constructor(private db: Kysely<DB>) {}

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

      // Upsert ticket waves by eventId and externalId
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

  // Retrieve paginated events with images using jsonArrayFrom
  async findAllPaginatedWithImages(pagination: {
    page: number;
    limit: number;
    offset: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
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
  async getAllActiveEventExternalIds(): Promise<string[]> {
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
}
