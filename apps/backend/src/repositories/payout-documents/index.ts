import type {Insertable, Updateable, Kysely} from 'kysely';
import type {DB, PayoutDocuments} from '@revendiste/shared';
import {BaseRepository} from '../base';

export class PayoutDocumentsRepository extends BaseRepository<PayoutDocumentsRepository> {
  withTransaction(trx: Kysely<DB>): PayoutDocumentsRepository {
    return new PayoutDocumentsRepository(trx);
  }

  /**
   * Create a new payout document
   */
  async create(data: Insertable<PayoutDocuments>) {
    return await this.db
      .insertInto('payoutDocuments')
      .values(data)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Get all documents for a payout (non-deleted)
   */
  async getByPayoutId(payoutId: string) {
    return await this.db
      .selectFrom('payoutDocuments')
      .selectAll()
      .where('payoutId', '=', payoutId)
      .where('deletedAt', 'is', null)
      .orderBy('uploadedAt', 'desc')
      .execute();
  }

  /**
   * Get document by ID
   */
  async getById(id: string) {
    return await this.db
      .selectFrom('payoutDocuments')
      .selectAll()
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  /**
   * Update a document
   */
  async update(id: string, data: Updateable<PayoutDocuments>) {
    return await this.db
      .updateTable('payoutDocuments')
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Soft delete a document
   */
  async softDelete(id: string) {
    const result = await this.db
      .updateTable('payoutDocuments')
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .execute();

    return result.length > 0;
  }
}

