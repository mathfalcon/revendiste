import {type Insertable, type Kysely, type Updateable} from 'kysely';
import type {DB, EventTicketWaveConfigs} from '@revendiste/shared';
import {BaseRepository} from '../base';

export class EventTicketWaveConfigsRepository extends BaseRepository<EventTicketWaveConfigsRepository> {
  withTransaction(trx: Kysely<DB>): EventTicketWaveConfigsRepository {
    return new EventTicketWaveConfigsRepository(trx);
  }

  async create(data: Insertable<EventTicketWaveConfigs>) {
    return await this.db
      .insertInto('eventTicketWaveConfigs')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getByWaveId(eventTicketWaveId: string) {
    return await this.db
      .selectFrom('eventTicketWaveConfigs')
      .selectAll()
      .where('eventTicketWaveId', '=', eventTicketWaveId)
      .executeTakeFirst();
  }

  async getByWaveIdForUpdate(eventTicketWaveId: string) {
    return await this.db
      .selectFrom('eventTicketWaveConfigs')
      .selectAll()
      .where('eventTicketWaveId', '=', eventTicketWaveId)
      .forUpdate()
      .executeTakeFirst();
  }

  async listByEventId(eventId: string) {
    return await this.db
      .selectFrom('eventTicketWaveConfigs')
      .innerJoin(
        'eventTicketWaves',
        'eventTicketWaves.id',
        'eventTicketWaveConfigs.eventTicketWaveId',
      )
      .select([
        'eventTicketWaveConfigs.id',
        'eventTicketWaveConfigs.eventTicketWaveId',
        'eventTicketWaveConfigs.stock',
        'eventTicketWaveConfigs.houseListingId',
      ])
      .where('eventTicketWaves.eventId', '=', eventId)
      .where('eventTicketWaves.deletedAt', 'is', null)
      .orderBy('eventTicketWaveConfigs.displayOrder', 'asc')
      .orderBy('eventTicketWaveConfigs.createdAt', 'asc')
      .execute();
  }

  async updateByWaveId(
    eventTicketWaveId: string,
    data: Updateable<EventTicketWaveConfigs>,
  ) {
    return await this.db
      .updateTable('eventTicketWaveConfigs')
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where('eventTicketWaveId', '=', eventTicketWaveId)
      .returningAll()
      .executeTakeFirst();
  }

  async setHouseListingId(eventTicketWaveId: string, houseListingId: string) {
    return await this.db
      .updateTable('eventTicketWaveConfigs')
      .set({
        houseListingId,
        updatedAt: new Date(),
      })
      .where('eventTicketWaveId', '=', eventTicketWaveId)
      .returningAll()
      .executeTakeFirst();
  }
}
