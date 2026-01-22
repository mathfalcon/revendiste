import {type Kysely, sql} from 'kysely';
import type {DB} from '@revendiste/shared';
import {BaseRepository} from '../base';
import {jsonArrayFrom} from 'kysely/helpers/postgres';

export class EventViewsRepository extends BaseRepository<EventViewsRepository> {
  withTransaction(trx: Kysely<DB>): EventViewsRepository {
    return new EventViewsRepository(trx);
  }

  /**
   * Increment the view count for an event on a specific date
   * Uses upsert (INSERT ... ON CONFLICT UPDATE) for atomic increment
   */
  async incrementViewCount(eventId: string, date: Date) {
    const dateOnly = date.toISOString().split('T')[0]; // YYYY-MM-DD format

    await this.db
      .insertInto('eventViewsDaily')
      .values({
        eventId,
        date: new Date(dateOnly),
        viewCount: 1,
      })
      .onConflict(oc =>
        oc.columns(['eventId', 'date']).doUpdateSet(eb => ({
          viewCount: sql`${eb.ref('eventViewsDaily.viewCount')} + 1`,
          updatedAt: new Date(),
        })),
      )
      .execute();
  }

  /**
   * Get trending events sorted by total views within a time window
   *
   * @param days - Number of days to look back (default: 7)
   * @param limit - Maximum number of events to return (default: 10)
   */
  async getTrendingEvents(days: number = 7, limit: number = 10) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

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
        'events.venueId',
        'events.externalUrl',
        'events.status',
        'events.createdAt',
        'events.updatedAt',
        // Sum of views in the time window
        sql<number>`
          COALESCE(
            (
              SELECT SUM(view_count)::int
              FROM event_views_daily
              WHERE event_views_daily.event_id = events.id
                AND event_views_daily.date >= ${startDate}
            ),
            0
          )
        `.as('totalViews'),
        // Include images
        jsonArrayFrom(
          eb
            .selectFrom('eventImages')
            .select(['eventImages.url', 'eventImages.imageType'])
            .whereRef('eventImages.eventId', '=', 'events.id')
            .orderBy('eventImages.displayOrder'),
        ).as('eventImages'),
        // Venue info from join
        sql<{name: string; city: string} | null>`
          CASE 
            WHEN event_venues.id IS NOT NULL 
            THEN json_build_object('name', event_venues.name, 'city', event_venues.city)
            ELSE NULL
          END
        `.as('venue'),
      ])
      .where('events.deletedAt', 'is', null)
      .where('events.status', '=', 'active')
      .where('events.eventEndDate', '>', now) // Only active/upcoming events
      .orderBy(sql`COALESCE(
        (
          SELECT SUM(view_count)::int
          FROM event_views_daily
          WHERE event_views_daily.event_id = events.id
            AND event_views_daily.date >= ${startDate}
        ),
        0
      )`, 'desc')
      .orderBy('events.eventStartDate', 'asc') // Secondary sort by date
      .limit(limit)
      .execute();

    return events;
  }

  /**
   * Get view count for a specific event within a time window
   */
  async getEventViewCount(eventId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.db
      .selectFrom('eventViewsDaily')
      .select(sql<number>`COALESCE(SUM(view_count), 0)::int`.as('totalViews'))
      .where('eventId', '=', eventId)
      .where('date', '>=', startDate)
      .executeTakeFirst();

    return result?.totalViews ?? 0;
  }
}
