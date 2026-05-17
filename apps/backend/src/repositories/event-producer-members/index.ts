import {type Insertable, type Kysely, type Updateable} from 'kysely';
import type {
  DB,
  EventProducerMemberRole,
  EventProducerMembers,
} from '@revendiste/shared';
import {BaseRepository} from '../base';

export class EventProducerMembersRepository extends BaseRepository<EventProducerMembersRepository> {
  withTransaction(trx: Kysely<DB>): EventProducerMembersRepository {
    return new EventProducerMembersRepository(trx);
  }

  async listByEventProducerId(eventProducerId: string) {
    return await this.db
      .selectFrom('eventProducerMembers')
      .innerJoin('users', 'users.id', 'eventProducerMembers.userId')
      .select([
        'eventProducerMembers.id',
        'eventProducerMembers.eventProducerId',
        'eventProducerMembers.userId',
        'eventProducerMembers.role',
        'eventProducerMembers.invitedAt',
        'eventProducerMembers.acceptedAt',
        'eventProducerMembers.createdAt',
        'users.email as userEmail',
        'users.firstName as userFirstName',
        'users.lastName as userLastName',
        'users.imageUrl as userImageUrl',
      ])
      .where('eventProducerMembers.eventProducerId', '=', eventProducerId)
      .where('eventProducerMembers.deletedAt', 'is', null)
      .where('users.deletedAt', 'is', null)
      .orderBy('eventProducerMembers.createdAt', 'asc')
      .execute();
  }

  async getActiveByEventProducerAndUser(eventProducerId: string, userId: string) {
    return await this.db
      .selectFrom('eventProducerMembers')
      .selectAll()
      .where('eventProducerId', '=', eventProducerId)
      .where('userId', '=', userId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  async create(data: Insertable<EventProducerMembers>) {
    return await this.db
      .insertInto('eventProducerMembers')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateRole(
    eventProducerId: string,
    userId: string,
    role: EventProducerMemberRole,
  ) {
    return await this.db
      .updateTable('eventProducerMembers')
      .set({
        role,
      })
      .where('eventProducerId', '=', eventProducerId)
      .where('userId', '=', userId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }

  async softDeleteByEventProducerAndUser(eventProducerId: string, userId: string) {
    return await this.db
      .updateTable('eventProducerMembers')
      .set({
        deletedAt: new Date(),
      })
      .where('eventProducerId', '=', eventProducerId)
      .where('userId', '=', userId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }

  async reactivate(
    eventProducerId: string,
    userId: string,
    data: Updateable<EventProducerMembers>,
  ) {
    return await this.db
      .updateTable('eventProducerMembers')
      .set({
        ...data,
        deletedAt: null,
      })
      .where('eventProducerId', '=', eventProducerId)
      .where('userId', '=', userId)
      .where('deletedAt', 'is not', null)
      .returningAll()
      .executeTakeFirst();
  }
}
