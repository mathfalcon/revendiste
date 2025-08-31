import {Kysely} from 'kysely';
import {DB} from '~/types';

export class EventTicketWavesRepository {
  constructor(private readonly db: Kysely<DB>) {}

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
