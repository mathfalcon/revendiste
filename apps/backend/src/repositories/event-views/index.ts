import {type Kysely, sql} from 'kysely';
import type {DB} from '@revendiste/shared';
import {BaseRepository} from '../base';
import {jsonArrayFrom} from 'kysely/helpers/postgres';

export class EventViewsRepository extends BaseRepository<EventViewsRepository> {
  withTransaction(trx: Kysely<DB>): EventViewsRepository {
    return new EventViewsRepository(trx);
  }

  /**
   * Increment the view count for an event on the current date
   * Uses upsert (INSERT ... ON CONFLICT UPDATE) for atomic increment
   * Uses database's CURRENT_DATE to avoid timezone inconsistencies
   */
  async incrementViewCount(eventId: string) {
    await sql`
      INSERT INTO event_views_daily (id, event_id, date, view_count, created_at, updated_at)
      VALUES (gen_random_uuid(), ${eventId}, CURRENT_DATE, 1, NOW(), NOW())
      ON CONFLICT (event_id, date) 
      DO UPDATE SET 
        view_count = event_views_daily.view_count + 1,
        updated_at = NOW()
    `.execute(this.db);
  }

  /**
   * Get trending events sorted by total views within a time window
   *
   * @param days - Number of days to look back (default: 7)
   * @param limit - Maximum number of events to return (default: 10)
   */
  async getTrendingEvents(days: number = 7, limit: number = 10) {
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
        // Sum of views in the time window (use database's CURRENT_DATE for consistency)
        sql<number>`
          COALESCE(
            (
              SELECT SUM(view_count)::int
              FROM event_views_daily
              WHERE event_views_daily.event_id = events.id
                AND event_views_daily.date >= CURRENT_DATE - INTERVAL '${sql.raw(String(days))} days'
            ),
            0
          )
        `.as('totalViews'),
        // Lowest available ticket price
        sql<number | null>`
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
        // Currency from the lowest priced ticket
        sql<string | null>`
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
      .where(sql<boolean>`events.event_end_date > NOW()`) // Only active/upcoming events (use database NOW())
      .orderBy(sql`COALESCE(
        (
          SELECT SUM(view_count)::int
          FROM event_views_daily
          WHERE event_views_daily.event_id = events.id
            AND event_views_daily.date >= CURRENT_DATE - INTERVAL '${sql.raw(String(days))} days'
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
    const result = await this.db
      .selectFrom('eventViewsDaily')
      .select(sql<number>`COALESCE(SUM(view_count), 0)::int`.as('totalViews'))
      .where('eventId', '=', eventId)
      .where(sql<boolean>`date >= CURRENT_DATE - INTERVAL '${sql.raw(String(days))} days'`)
      .executeTakeFirst();

    return result?.totalViews ?? 0;
  }
}
