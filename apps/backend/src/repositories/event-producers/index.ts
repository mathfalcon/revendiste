import {type Insertable, type Kysely, type Updateable} from 'kysely';
import type {DB, EventProducers} from '@revendiste/shared';
import {BaseRepository} from '../base';

export class EventProducersRepository extends BaseRepository<EventProducersRepository> {
  withTransaction(trx: Kysely<DB>): EventProducersRepository {
    return new EventProducersRepository(trx);
  }

  async list(search?: string) {
    let query = this.db
      .selectFrom('eventProducers')
      .selectAll()
      .where('deletedAt', 'is', null)
      .orderBy('createdAt', 'desc');

    if (search && search.trim().length > 0) {
      const normalized = `%${search.trim()}%`;
      query = query.where(eb =>
        eb.or([
          eb('eventProducers.name', 'ilike', normalized),
          eb('eventProducers.slug', 'ilike', normalized),
        ]),
      );
    }

    return await query.execute();
  }

  async getById(id: string) {
    return await this.db
      .selectFrom('eventProducers')
      .selectAll()
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  async slugExists(slug: string, excludeId?: string) {
    let query = this.db
      .selectFrom('eventProducers')
      .select('id')
      .where('slug', '=', slug)
      .where('deletedAt', 'is', null);

    if (excludeId) {
      query = query.where('id', '!=', excludeId);
    }

    const row = await query.executeTakeFirst();
    return !!row;
  }

  async create(data: Insertable<EventProducers>) {
    return await this.db
      .insertInto('eventProducers')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(id: string, data: Updateable<EventProducers>) {
    return await this.db
      .updateTable('eventProducers')
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }

  async softDelete(id: string) {
    return await this.db
      .updateTable('eventProducers')
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }
}
