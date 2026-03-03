import { type Insertable, type Kysely, type Updateable } from 'kysely';
import { DB, type Invoices, type InvoiceParty } from '@revendiste/shared';
import { BaseRepository } from '../base';

export class InvoicesRepository extends BaseRepository<InvoicesRepository> {
  withTransaction(trx: Kysely<DB>): InvoicesRepository {
    return new InvoicesRepository(trx);
  }

  async getById(id: string) {
    return await this.db
      .selectFrom('invoices')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async getByOrderAndParty(
    orderId: string,
    party: InvoiceParty,
    sellerUserId?: string | null,
  ) {
    let query = this.db
      .selectFrom('invoices')
      .selectAll()
      .where('orderId', '=', orderId)
      .where('party', '=', party);

    if (party === 'buyer') {
      query = query.where('sellerUserId', 'is', null);
    } else if (sellerUserId != null) {
      query = query.where('sellerUserId', '=', sellerUserId);
    }

    return await query.executeTakeFirst();
  }

  async create(data: Insertable<Invoices>) {
    return await this.db
      .insertInto('invoices')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(id: string, data: Updateable<Invoices>) {
    return await this.db
      .updateTable('invoices')
      .set(data)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async getFailedInvoices(limit: number = 100) {
    return await this.db
      .selectFrom('invoices')
      .selectAll()
      .where('status', '=', 'failed')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .execute();
  }
}
