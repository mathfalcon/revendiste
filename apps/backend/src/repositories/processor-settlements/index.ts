import {BaseRepository} from '~/repositories/base';
import type {Kysely, Insertable, Updateable} from 'kysely';
import type {
  DB,
  PaymentProvider,
  ProcessorSettlements,
  ProcessorSettlementItems,
} from '@revendiste/shared';

export class ProcessorSettlementsRepository extends BaseRepository<ProcessorSettlementsRepository> {
  withTransaction(trx: Kysely<DB>): ProcessorSettlementsRepository {
    return new ProcessorSettlementsRepository(trx);
  }

  async createSettlement(data: Insertable<ProcessorSettlements>) {
    return await this.db
      .insertInto('processorSettlements')
      .values({
        ...data,
        id: data.id || crypto.randomUUID(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getSettlementById(settlementId: string) {
    return await this.db
      .selectFrom('processorSettlements')
      .selectAll()
      .where('id', '=', settlementId)
      .executeTakeFirst();
  }

  async getByProviderAndExternalSettlementId(
    paymentProvider: PaymentProvider,
    externalSettlementId: string,
  ) {
    return await this.db
      .selectFrom('processorSettlements')
      .selectAll()
      .where('paymentProvider', '=', paymentProvider)
      .where('settlementId', '=', externalSettlementId)
      .executeTakeFirst();
  }

  async listSettlements(params: {
    limit?: number;
    offset?: number;
    status?: string;
    paymentProvider?: PaymentProvider;
  }) {
    let query = this.db
      .selectFrom('processorSettlements')
      .selectAll()
      .orderBy('settlementDate', 'desc');

    if (params.status) {
      query = query.where('status', '=', params.status);
    }

    if (params.paymentProvider) {
      query = query.where('paymentProvider', '=', params.paymentProvider);
    }

    if (params.offset) {
      query = query.offset(params.offset);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    return await query.execute();
  }

  async updateSettlement(
    settlementId: string,
    data: Updateable<ProcessorSettlements>,
  ) {
    return await this.db
      .updateTable('processorSettlements')
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where('id', '=', settlementId)
      .returningAll()
      .executeTakeFirst();
  }

  async createSettlementItem(data: Insertable<ProcessorSettlementItems>) {
    return await this.db
      .insertInto('processorSettlementItems')
      .values({
        ...data,
        id: data.id || crypto.randomUUID(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getSettlementItemsBySettlementId(settlementId: string) {
    return await this.db
      .selectFrom('processorSettlementItems')
      .selectAll()
      .where('settlementId', '=', settlementId)
      .orderBy('createdAt', 'asc')
      .execute();
  }

  async getSettlementItemByOperationId(operationId: string) {
    return await this.db
      .selectFrom('processorSettlementItems')
      .selectAll()
      .where('operationId', '=', operationId)
      .executeTakeFirst();
  }

  async linkSettlementItemToPayout(itemId: string, payoutId: string) {
    return await this.db
      .updateTable('processorSettlementItems')
      .set({
        payoutId,
        updatedAt: new Date(),
      })
      .where('id', '=', itemId)
      .returningAll()
      .executeTakeFirst();
  }

  async getSettlementStats(params?: {
    status?: string;
    paymentProvider?: PaymentProvider;
  }) {
    let query = this.db
      .selectFrom('processorSettlements')
      .select(eb => [
        eb.fn.count<number>('id').as('totalCount'),
        eb.fn.sum<string>('totalAmount').as('totalAmount'),
      ]);

    if (params?.status) {
      query = query.where('status', '=', params.status);
    }

    if (params?.paymentProvider) {
      query = query.where('paymentProvider', '=', params.paymentProvider);
    }

    return await query.executeTakeFirst();
  }
}
