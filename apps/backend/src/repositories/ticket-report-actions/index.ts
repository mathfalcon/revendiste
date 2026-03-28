import {Kysely} from 'kysely';
import {DB} from '@revendiste/shared';
import type {TicketReportActionType} from '@revendiste/shared';
import {BaseRepository} from '../base';

export class TicketReportActionsRepository extends BaseRepository<TicketReportActionsRepository> {
  withTransaction(trx: Kysely<DB>): TicketReportActionsRepository {
    return new TicketReportActionsRepository(trx);
  }

  async create(data: {
    ticketReportId: string;
    performedByUserId: string;
    performedByAdmin: boolean;
    actionType: TicketReportActionType;
    comment?: string | null;
    metadata?: Record<string, unknown> | null;
  }) {
    return await this.db
      .insertInto('ticketReportActions')
      .values({
        ticketReportId: data.ticketReportId,
        performedByUserId: data.performedByUserId,
        performedByAdmin: data.performedByAdmin,
        actionType: data.actionType,
        comment: data.comment ?? null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getByReportId(ticketReportId: string) {
    return await this.db
      .selectFrom('ticketReportActions')
      .selectAll()
      .where('ticketReportId', '=', ticketReportId)
      .orderBy('createdAt', 'asc')
      .execute();
  }
}
