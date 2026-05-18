import {type Insertable, type Kysely, sql} from 'kysely';
import type {DB, TicketCodes} from '@revendiste/shared';
import {BaseRepository} from '../base';

export class TicketCodesRepository extends BaseRepository<TicketCodesRepository> {
  withTransaction(trx: Kysely<DB>): TicketCodesRepository {
    return new TicketCodesRepository(trx);
  }

  async create(data: Insertable<TicketCodes>) {
    return await this.db
      .insertInto('ticketCodes')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async createManyIfMissing(data: Array<Insertable<TicketCodes>>) {
    if (data.length === 0) {
      return;
    }

    await this.db
      .insertInto('ticketCodes')
      .values(data)
      .onConflict(oc => oc.column('listingTicketId').doNothing())
      .execute();
  }

  async getByListingTicketId(listingTicketId: string) {
    return await this.db
      .selectFrom('ticketCodes')
      .selectAll()
      .where('listingTicketId', '=', listingTicketId)
      .executeTakeFirst();
  }

  async getByListingTicketIds(listingTicketIds: string[]) {
    if (listingTicketIds.length === 0) {
      return [];
    }

    return await this.db
      .selectFrom('ticketCodes')
      .selectAll()
      .where('listingTicketId', 'in', listingTicketIds)
      .execute();
  }

  async touchByListingTicketId(listingTicketId: string) {
    return await this.db
      .updateTable('ticketCodes')
      .set({
        updatedAt: new Date(),
      })
      .where('listingTicketId', '=', listingTicketId)
      .returningAll()
      .executeTakeFirst();
  }

  async bumpGenerationByTicketIds(listingTicketIds: string[]) {
    if (listingTicketIds.length === 0) {
      return [];
    }

    return await this.db
      .updateTable('ticketCodes')
      .set(eb => ({
        generation: sql`${eb.ref('ticketCodes.generation')} + 1`,
        updatedAt: new Date(),
      }))
      .where('listingTicketId', 'in', listingTicketIds)
      .returningAll()
      .execute();
  }
}
