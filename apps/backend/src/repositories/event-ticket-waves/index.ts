import {type Kysely} from 'kysely';
import type {DB} from '../../types/db';

export class EventTicketWavesRepository {
  constructor(private db: Kysely<DB>) {}

  // Create
  async create(ticketWave: {
    eventId: string;
    externalId: string;
    name: string;
    description?: string | null;
    faceValue: number;
    currency: string;
    metadata?: any;
  }) {
    const [created] = await this.db
      .insertInto('eventTicketWaves')
      .values({
        ...ticketWave,
        isAvailable: true,
        isSoldOut: false,
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
        .selectFrom('eventTicketWaves')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst()) || null
    );
  }

  // Read - Get by external ID
  async findByExternalId(externalId: string) {
    return (
      (await this.db
        .selectFrom('eventTicketWaves')
        .selectAll()
        .where('externalId', '=', externalId)
        .executeTakeFirst()) || null
    );
  }

  // Read - Get by event ID
  async findByEventId(eventId: string) {
    return await this.db
      .selectFrom('eventTicketWaves')
      .selectAll()
      .where('eventId', '=', eventId)
      .orderBy('createdAt', 'asc')
      .execute();
  }

  // Read - Get available ticket waves
  async findAvailable(eventId: string) {
    return await this.db
      .selectFrom('eventTicketWaves')
      .selectAll()
      .where('eventId', '=', eventId)
      .where('isAvailable', '=', true)
      .where('isSoldOut', '=', false)
      .where('status', '=', 'active')
      .orderBy('faceValue', 'asc')
      .execute();
  }

  // Read - Get by price range
  async findByPriceRange(
    eventId: string,
    minPrice: number,
    maxPrice: number,
    currency: string,
  ) {
    return await this.db
      .selectFrom('eventTicketWaves')
      .selectAll()
      .where('eventId', '=', eventId)
      .where('currency', '=', currency)
      .where('faceValue', '>=', minPrice)
      .where('faceValue', '<=', maxPrice)
      .where('isAvailable', '=', true)
      .orderBy('faceValue', 'asc')
      .execute();
  }

  // Update
  async update(
    id: string,
    updates: {
      name?: string;
      description?: string | null;
      faceValue?: number;
      currency?: string;
      isAvailable?: boolean;
      isSoldOut?: boolean;
      status?: string;
      metadata?: any;
    },
  ) {
    const [updated] = await this.db
      .updateTable('eventTicketWaves')
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
      .updateTable('eventTicketWaves')
      .set({
        lastScrapedAt: new Date(),
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .execute();
  }

  // Update availability
  async updateAvailability(
    id: string,
    isAvailable: boolean,
    isSoldOut: boolean,
  ) {
    const result = await this.db
      .updateTable('eventTicketWaves')
      .set({
        isAvailable,
        isSoldOut,
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .execute();

    return result.length > 0;
  }

  // Delete
  async delete(id: string) {
    const result = await this.db
      .deleteFrom('eventTicketWaves')
      .where('id', '=', id)
      .execute();

    return result.length > 0;
  }

  // Soft delete by updating status
  async softDelete(id: string) {
    const result = await this.db
      .updateTable('eventTicketWaves')
      .set({
        status: 'deleted',
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .execute();

    return result.length > 0;
  }

  // Count by event ID
  async countByEventId(eventId: string) {
    const result = await this.db
      .selectFrom('eventTicketWaves')
      .select(({fn}) => [fn.countAll().as('count')])
      .where('eventId', '=', eventId)
      .executeTakeFirst();

    return Number(result?.count) || 0;
  }

  // Count available by event ID
  async countAvailableByEventId(eventId: string) {
    const result = await this.db
      .selectFrom('eventTicketWaves')
      .select(({fn}) => [fn.countAll().as('count')])
      .where('eventId', '=', eventId)
      .where('isAvailable', '=', true)
      .where('isSoldOut', '=', false)
      .executeTakeFirst();

    return Number(result?.count) || 0;
  }
}
