import {Kysely} from 'kysely';
import {DB} from '@revendiste/shared';
import {BaseRepository} from '../base';

export class EventTicketWavesRepository extends BaseRepository<EventTicketWavesRepository> {
  withTransaction(trx: Kysely<DB>): EventTicketWavesRepository {
    return new EventTicketWavesRepository(trx);
  }

  async getById(id: string) {
    const result = await this.db
      .selectFrom('eventTicketWaves')
      .selectAll()
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    return result;
  }

  async findByEventId(eventId: string) {
    return this.db
      .selectFrom('eventTicketWaves')
      .selectAll()
      .where('eventId', '=', eventId)
      .where('deletedAt', 'is', null)
      .where('status', '=', 'active')
      .orderBy('faceValue', 'asc')
      .executeTakeFirst();
  }
}
