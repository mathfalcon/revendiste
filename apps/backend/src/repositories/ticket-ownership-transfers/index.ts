import {type Insertable, type Kysely} from 'kysely';
import type {DB, TicketOwnershipTransfers} from '@revendiste/shared';
import {BaseRepository} from '../base';
import {isUniqueViolation} from '~/utils/db-errors';

export class TicketOwnershipTransfersRepository extends BaseRepository<TicketOwnershipTransfersRepository> {
  withTransaction(trx: Kysely<DB>): TicketOwnershipTransfersRepository {
    return new TicketOwnershipTransfersRepository(trx);
  }

  async createManyIdempotent(data: Array<Insertable<TicketOwnershipTransfers>>) {
    if (data.length === 0) {
      return [];
    }

    const inserted: Array<{
      id: string;
      listingTicketId: string;
      fromUserId: string | null;
      toUserId: string | null;
      fromOrderId: string | null;
      toOrderId: string | null;
      transferType: string;
      createdAt: Date;
    }> = [];

    for (const row of data) {
      try {
        const created = await this.db
          .insertInto('ticketOwnershipTransfers')
          .values(row)
          .returningAll()
          .executeTakeFirstOrThrow();
        inserted.push(created);
      } catch (error) {
        if (isUniqueViolation(error)) {
          continue;
        }
        throw error;
      }
    }

    return inserted;
  }
}
