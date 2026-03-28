import {Kysely} from 'kysely';
import {DB} from '@revendiste/shared';
import {BaseRepository} from '../base';

export class TicketReportAttachmentsRepository extends BaseRepository<TicketReportAttachmentsRepository> {
  withTransaction(trx: Kysely<DB>): TicketReportAttachmentsRepository {
    return new TicketReportAttachmentsRepository(trx);
  }

  async create(data: {
    ticketReportId: string;
    uploadedByUserId: string;
    storagePath: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    ticketReportActionId?: string;
  }) {
    return await this.db
      .insertInto('ticketReportAttachments')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getByReportId(ticketReportId: string) {
    return await this.db
      .selectFrom('ticketReportAttachments')
      .selectAll()
      .where('ticketReportId', '=', ticketReportId)
      .orderBy('createdAt', 'asc')
      .execute();
  }

  async getById(id: string) {
    return await this.db
      .selectFrom('ticketReportAttachments')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async deleteById(id: string) {
    return await this.db
      .deleteFrom('ticketReportAttachments')
      .where('id', '=', id)
      .executeTakeFirstOrThrow();
  }

  async countByReportId(ticketReportId: string) {
    const result = await this.db
      .selectFrom('ticketReportAttachments')
      .select(eb => eb.fn.countAll<number>().as('count'))
      .where('ticketReportId', '=', ticketReportId)
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }
}
