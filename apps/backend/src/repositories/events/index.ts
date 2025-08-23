import {type Kysely, sql} from 'kysely';
import type {DB} from '../../types/db';

export class EventsRepository {
  constructor(private db: Kysely<DB>) {}

  // Create
  async create(event: {
    externalId: string;
    platform: string;
    name: string;
    description?: string | null;
    eventStartDate: Date;
    eventEndDate: Date;
    venueName?: string | null;
    venueAddress: string;
    externalUrl: string;
    metadata?: any;
  }) {
    const [created] = await this.db
      .insertInto('events')
      .values({
        ...event,
        status: 'active',
      })
      .returningAll()
      .execute();

    return created;
  }

  // Read - Get by ID
  async findById(id: string) {
    return (
      (await this.db
        .selectFrom('events')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst()) || null
    );
  }

  // Read - Get by external ID
  async findByExternalId(externalId: string) {
    return (
      (await this.db
        .selectFrom('events')
        .selectAll()
        .where('externalId', '=', externalId)
        .executeTakeFirst()) || null
    );
  }

  // Read - Get all events with pagination
  async findAll(limit: number = 50, offset: number = 0) {
    return await this.db
      .selectFrom('events')
      .selectAll()
      .orderBy('eventStartDate', 'asc')
      .limit(limit)
      .offset(offset)
      .execute();
  }

  // Read - Get events by platform
  async findByPlatform(
    platform: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    return await this.db
      .selectFrom('events')
      .selectAll()
      .where('platform', '=', platform)
      .orderBy('eventStartDate', 'asc')
      .limit(limit)
      .offset(offset)
      .execute();
  }

  // Read - Fuzzy search by name using full-text search
  async searchByName(
    searchTerm: string,
    limit: number = 20,
    offset: number = 0,
  ) {
    return await this.db
      .selectFrom('events')
      .selectAll()
      .where(
        sql`to_tsvector('spanish', name) @@ plainto_tsquery('spanish', ${searchTerm})`,
      )
      .orderBy(
        sql`ts_rank(to_tsvector('spanish', name), plainto_tsquery('spanish', ${searchTerm})) DESC`,
      )
      .limit(limit)
      .offset(offset)
      .execute();
  }

  // Read - Get upcoming events
  async findUpcoming(limit: number = 50, offset: number = 0) {
    return await this.db
      .selectFrom('events')
      .selectAll()
      .where('eventStartDate', '>', new Date())
      .where('status', '=', 'active')
      .orderBy('eventStartDate', 'asc')
      .limit(limit)
      .offset(offset)
      .execute();
  }

  // Update
  async update(
    id: string,
    updates: {
      externalId?: string;
      platform?: string;
      name?: string;
      description?: string | null;
      eventStartDate?: Date;
      eventEndDate?: Date;
      venueName?: string | null;
      venueAddress?: string;
      externalUrl?: string;
      status?: string;
      metadata?: any;
    },
  ) {
    const [updated] = await this.db
      .updateTable('events')
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .execute();

    return updated || null;
  }

  // Update - Update last scraped timestamp
  async updateLastScraped(id: string) {
    await this.db
      .updateTable('events')
      .set({
        lastScrapedAt: new Date(),
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .execute();
  }

  // Delete
  async delete(id: string) {
    const result = await this.db
      .deleteFrom('events')
      .where('id', '=', id)
      .execute();

    return result.length > 0;
  }

  // Soft delete by updating status
  async softDelete(id: string) {
    const result = await this.db
      .updateTable('events')
      .set({
        status: 'deleted',
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .execute();

    return result.length > 0;
  }

  // Count total events
  async count() {
    const result = await this.db
      .selectFrom('events')
      .select(sql<number>`count(*)`.as('count'))
      .executeTakeFirst();

    return Number(result?.count) || 0;
  }

  // Count events by platform
  async countByPlatform(platform: string) {
    const result = await this.db
      .selectFrom('events')
      .select(sql<number>`count(*)`.as('count'))
      .where('platform', '=', platform)
      .executeTakeFirst();

    return Number(result?.count) || 0;
  }
}
