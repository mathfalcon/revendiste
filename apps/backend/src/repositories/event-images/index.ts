import {type Kysely} from 'kysely';
import type {DB} from '../../types/db';

export class EventImagesRepository {
  constructor(private db: Kysely<DB>) {}

  // Create
  async create(eventImage: {
    eventId: string;
    url: string;
    altText?: string | null;
    imageType: string;
    displayOrder: number;
  }) {
    const [created] = await this.db
      .insertInto('eventImages')
      .values(eventImage)
      .returningAll()
      .execute();

    return created;
  }

  // Read - Get by ID
  async findById(id: string) {
    return (
      (await this.db
        .selectFrom('eventImages')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst()) || null
    );
  }

  // Read - Get by event ID
  async findByEventId(eventId: string) {
    return await this.db
      .selectFrom('eventImages')
      .selectAll()
      .where('eventId', '=', eventId)
      .orderBy('displayOrder', 'asc')
      .execute();
  }

  // Read - Get by image type
  async findByImageType(eventId: string, imageType: string) {
    return await this.db
      .selectFrom('eventImages')
      .selectAll()
      .where('eventId', '=', eventId)
      .where('imageType', '=', imageType)
      .orderBy('displayOrder', 'asc')
      .execute();
  }

  // Update
  async update(
    id: string,
    updates: {
      url?: string;
      altText?: string | null;
      imageType?: string;
      displayOrder?: number;
    },
  ) {
    const [updated] = await this.db
      .updateTable('eventImages')
      .set(updates)
      .where('id', '=', id)
      .returningAll()
      .execute();

    return updated || null;
  }

  // Delete
  async delete(id: string) {
    const result = await this.db
      .deleteFrom('eventImages')
      .where('id', '=', id)
      .execute();

    return result.length > 0;
  }

  // Delete by event ID
  async deleteByEventId(eventId: string) {
    const result = await this.db
      .deleteFrom('eventImages')
      .where('eventId', '=', eventId)
      .execute();

    return result.length > 0;
  }

  // Count by event ID
  async countByEventId(eventId: string) {
    const result = await this.db
      .selectFrom('eventImages')
      .select(({fn}) => [fn.countAll().as('count')])
      .where('eventId', '=', eventId)
      .executeTakeFirst();

    return Number(result?.count) || 0;
  }
}
