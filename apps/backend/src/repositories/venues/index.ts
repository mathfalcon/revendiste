import {type Kysely, type Insertable, sql} from 'kysely';
import type {DB, EventVenues} from '@revendiste/shared';
import {BaseRepository} from '../base';

type InsertableVenue = Insertable<EventVenues>;

export class VenuesRepository extends BaseRepository<VenuesRepository> {
  withTransaction(trx: Kysely<DB>): VenuesRepository {
    return new VenuesRepository(trx);
  }

  /**
   * Find venue by Google Place ID (for deduplication)
   */
  async findByGooglePlaceId(googlePlaceId: string) {
    return await this.db
      .selectFrom('eventVenues')
      .selectAll()
      .where('googlePlaceId', '=', googlePlaceId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  /**
   * Find venue by name and address (for deduplication when coordinates are not available)
   * Uses case-insensitive matching on name
   */
  async findByNameAndAddress(name: string, address: string) {
    return await this.db
      .selectFrom('eventVenues')
      .selectAll()
      .where('deletedAt', 'is', null)
      .where(eb =>
        eb.or([
          // Match by lowercase name
          eb(sql`LOWER(name)`, '=', name.toLowerCase()),
          // Or match by lowercase address if name is the address
          eb(sql`LOWER(address)`, '=', address.toLowerCase()),
        ]),
      )
      .executeTakeFirst();
  }

  /**
   * Find venues near coordinates within a given radius
   * Uses Haversine formula for distance calculation
   *
   * @param lat - Latitude
   * @param lng - Longitude
   * @param radiusMeters - Search radius in meters (default: 100m)
   */
  async findByCoordinates(
    lat: number,
    lng: number,
    radiusMeters: number = 100,
  ) {
    // Convert radius from meters to approximate degrees (1 degree ≈ 111,320 meters at equator)
    // This is a rough approximation but sufficient for small distances
    const radiusDegrees = radiusMeters / 111320;

    // First do a bounding box filter (fast), then calculate actual distance
    const venues = await this.db
      .selectFrom('eventVenues')
      .selectAll()
      .select(
        sql<number>`
          6371000 * 2 * ASIN(SQRT(
            POWER(SIN((RADIANS(${lat}) - RADIANS(latitude)) / 2), 2) +
            COS(RADIANS(${lat})) * COS(RADIANS(latitude)) *
            POWER(SIN((RADIANS(${lng}) - RADIANS(longitude)) / 2), 2)
          ))
        `.as('distanceMeters'),
      )
      .where('deletedAt', 'is', null)
      .where('latitude', 'is not', null)
      .where('longitude', 'is not', null)
      // Bounding box filter for performance
      .where('latitude', '>=', (lat - radiusDegrees).toString())
      .where('latitude', '<=', (lat + radiusDegrees).toString())
      .where('longitude', '>=', (lng - radiusDegrees).toString())
      .where('longitude', '<=', (lng + radiusDegrees).toString())
      .orderBy('distanceMeters', 'asc')
      .execute();

    // Filter by actual distance
    return venues.filter(v => v.distanceMeters <= radiusMeters);
  }

  /**
   * Search venues by name (for admin venue selector combobox)
   */
  async searchByName(query: string, limit: number = 20) {
    const searchPattern = `%${query}%`;
    return await this.db
      .selectFrom('eventVenues')
      .select(['id', 'name', 'address', 'city'])
      .where('deletedAt', 'is', null)
      .where('name', 'ilike', searchPattern)
      .limit(limit)
      .execute();
  }

  /**
   * Create a new venue
   */
  async create(data: InsertableVenue) {
    return await this.db
      .insertInto('eventVenues')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Create a new venue, handling googlePlaceId conflicts gracefully.
   * If a venue with the same googlePlaceId already exists, returns the existing one.
   * This prevents race conditions when multiple events with the same venue
   * are processed concurrently.
   *
   * Uses try-catch instead of ON CONFLICT because the unique index on
   * googlePlaceId is a partial index (WHERE google_place_id IS NOT NULL),
   * which PostgreSQL's ON CONFLICT (column) cannot match.
   */
  async createOrFindByPlaceId(data: InsertableVenue) {
    try {
      return await this.db
        .insertInto('eventVenues')
        .values(data)
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error: any) {
      // Unique constraint violation on googlePlaceId — return existing venue
      if (error?.code === '23505' && data.googlePlaceId) {
        const existing = await this.findByGooglePlaceId(
          data.googlePlaceId as string,
        );
        if (existing) return existing;
      }
      throw error;
    }
  }

  /**
   * Get all distinct cities for the filter dropdown
   * Only returns cities that have at least one active event
   */
  async getDistinctCities() {
    const result = await this.db
      .selectFrom('eventVenues')
      .select('city')
      .distinct()
      .innerJoin('events', 'events.venueId', 'eventVenues.id')
      .where('eventVenues.deletedAt', 'is', null)
      .where('events.deletedAt', 'is', null)
      .where('events.status', '=', 'active')
      .where('events.eventEndDate', '>', new Date())
      .orderBy('city', 'asc')
      .execute();

    return result.map(r => r.city);
  }

  /**
   * Get distinct regions with active future events, grouped by country
   */
  async getDistinctRegions() {
    const result = await this.db
      .selectFrom('eventVenues')
      .select(['country', 'region'])
      .distinct()
      .innerJoin('events', 'events.venueId', 'eventVenues.id')
      .where('eventVenues.deletedAt', 'is', null)
      .where('eventVenues.region', 'is not', null)
      .where('events.deletedAt', 'is', null)
      .where('events.status', '=', 'active')
      .where('events.eventEndDate', '>', new Date())
      .orderBy('country', 'asc')
      .orderBy('region', 'asc')
      .execute();

    // Group by country
    const grouped = new Map<string, string[]>();
    for (const row of result) {
      if (!row.region) continue;
      const regions = grouped.get(row.country) ?? [];
      regions.push(row.region);
      grouped.set(row.country, regions);
    }

    return Array.from(grouped.entries()).map(([country, regions]) => ({
      country,
      regions,
    }));
  }

  /**
   * Get venue by ID
   */
  async getById(venueId: string) {
    return await this.db
      .selectFrom('eventVenues')
      .selectAll()
      .where('id', '=', venueId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  /**
   * Update venue
   */
  async updateVenue(
    venueId: string,
    data: {
      name?: string;
      address?: string;
      city?: string;
      region?: string | null;
      country?: string;
      googlePlaceId?: string | null;
      latitude?: string | null;
      longitude?: string | null;
    },
  ) {
    return await this.db
      .updateTable('eventVenues')
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where('id', '=', venueId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }
}
