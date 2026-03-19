import {Kysely, sql} from 'kysely';
import {DB} from '@revendiste/shared';
import type {EventTicketCurrency, TicketReportRefundStatus} from '@revendiste/shared';
import {BaseRepository} from '../base';

export class TicketReportRefundsRepository extends BaseRepository<TicketReportRefundsRepository> {
  withTransaction(trx: Kysely<DB>): TicketReportRefundsRepository {
    return new TicketReportRefundsRepository(trx);
  }

  async create(data: {
    ticketReportId: string;
    orderTicketReservationId: string;
    refundStatus?: TicketReportRefundStatus;
    refundAmount?: number | null;
    currency?: EventTicketCurrency | null;
  }) {
    return await this.db
      .insertInto('ticketReportRefunds')
      .values({
        ticketReportId: data.ticketReportId,
        orderTicketReservationId: data.orderTicketReservationId,
        refundStatus: data.refundStatus ?? 'pending',
        refundAmount: data.refundAmount ?? null,
        currency: data.currency ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async createBatch(
    records: Array<{
      ticketReportId: string;
      orderTicketReservationId: string;
      refundStatus?: TicketReportRefundStatus;
      refundAmount?: number | null;
      currency?: EventTicketCurrency | null;
    }>,
  ) {
    if (records.length === 0) return [];
    return await this.db
      .insertInto('ticketReportRefunds')
      .values(
        records.map(r => ({
          ticketReportId: r.ticketReportId,
          orderTicketReservationId: r.orderTicketReservationId,
          refundStatus: r.refundStatus ?? 'pending',
          refundAmount: r.refundAmount ?? null,
          currency: r.currency ?? null,
        })),
      )
      .returningAll()
      .execute();
  }

  async updateStatus(
    id: string,
    refundStatus: 'refunded' | 'skipped',
    processedAt: Date,
    refundAmount?: number,
  ) {
    return await this.db
      .updateTable('ticketReportRefunds')
      .set({
        refundStatus,
        processedAt,
        updatedAt: sql`now()`,
        ...(refundAmount !== undefined ? {refundAmount} : {}),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getByReportId(ticketReportId: string) {
    return await this.db
      .selectFrom('ticketReportRefunds')
      .selectAll()
      .where('ticketReportId', '=', ticketReportId)
      .execute();
  }

  async getByReservationId(orderTicketReservationId: string) {
    return await this.db
      .selectFrom('ticketReportRefunds')
      .selectAll()
      .where('orderTicketReservationId', '=', orderTicketReservationId)
      .executeTakeFirst();
  }
}
