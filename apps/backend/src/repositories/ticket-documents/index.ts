import type {Insertable, Updateable, Kysely} from 'kysely';
import type {DB, TicketDocuments} from '@revendiste/shared';
import {BaseRepository} from '../base';

export class TicketDocumentsRepository extends BaseRepository<TicketDocumentsRepository> {
  withTransaction(trx: Kysely<DB>): TicketDocumentsRepository {
    return new TicketDocumentsRepository(trx);
  }

  /**
   * Create a new ticket document
   */
  async create(data: Insertable<TicketDocuments>) {
    return await this.db
      .insertInto('ticketDocuments')
      .values(data)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Get the primary document for a ticket
   */
  async getPrimaryDocument(ticketId: string) {
    return await this.db
      .selectFrom('ticketDocuments')
      .selectAll()
      .where('ticketId', '=', ticketId)
      .where('isPrimary', '=', true)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  /**
   * Get all documents for a ticket (including non-primary and old versions)
   */
  async getAllDocuments(ticketId: string) {
    return await this.db
      .selectFrom('ticketDocuments')
      .selectAll()
      .where('ticketId', '=', ticketId)
      .where('deletedAt', 'is', null)
      .orderBy('version', 'desc')
      .orderBy('createdAt', 'desc')
      .execute();
  }

  /**
   * Get document by ID
   */
  async getById(id: string) {
    return await this.db
      .selectFrom('ticketDocuments')
      .selectAll()
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  /**
   * Update a document
   */
  async update(id: string, data: Updateable<TicketDocuments>) {
    return await this.db
      .updateTable('ticketDocuments')
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
      .updateTable('ticketDocuments')
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .execute();

    return result.length > 0;
  }

  /**
   * Mark old primary documents as replaced and set new document as primary
   */
  async replacePrimaryDocument(ticketId: string, newDocumentId: string) {
    await this.executeTransaction(async (trx: Kysely<DB>) => {
      // Mark old primary documents as replaced and not primary
      await trx
        .updateTable('ticketDocuments')
        .set({
          isPrimary: false,
          status: 'replaced',
          updatedAt: new Date(),
        })
        .where('ticketId', '=', ticketId)
        .where('isPrimary', '=', true)
        .where('deletedAt', 'is', null)
        .where('id', '!=', newDocumentId)
        .execute();

      // Set new document as primary
      await trx
        .updateTable('ticketDocuments')
        .set({
          isPrimary: true,
          status: 'verified',
          updatedAt: new Date(),
        })
        .where('id', '=', newDocumentId)
        .execute();
    });
  }

  /**
   * Get all sold tickets without primary documents
   * Useful for finding tickets that need documents uploaded
   */
  async getTicketsWithoutDocuments() {
    return (await this.db
      .selectFrom('listingTickets as lt')
      .leftJoin('ticketDocuments as td', join =>
        join
          .onRef('td.ticketId', '=', 'lt.id')
          .on('td.isPrimary', '=', true)
          .on('td.deletedAt', 'is', null),
      )
      .select(['lt.id as ticketId', 'lt.soldAt as soldAt', 'lt.listingId'])
      .where('lt.soldAt', 'is not', null)
      .where('lt.deletedAt', 'is', null)
      .where('lt.cancelledAt', 'is', null)
      .where('td.id', 'is', null) // No document exists
      .execute()) as Array<{ticketId: string; soldAt: Date; listingId: string}>;
  }

  /**
   * Verify a document (mark as verified)
   */
  async verifyDocument(id: string, verifiedBy: string) {
    return await this.db
      .updateTable('ticketDocuments')
      .set({
        status: 'verified',
        verifiedAt: new Date(),
        verifiedBy: verifiedBy,
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Reject a document
   */
  async rejectDocument(id: string, verifiedBy: string) {
    return await this.db
      .updateTable('ticketDocuments')
      .set({
        status: 'rejected',
        verifiedAt: new Date(),
        verifiedBy: verifiedBy,
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Get document count for a ticket
   */
  async getDocumentCount(ticketId: string) {
    const result = await this.db
      .selectFrom('ticketDocuments')
      .select(eb => eb.fn.countAll<number>().as('count'))
      .where('ticketId', '=', ticketId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    return Number(result?.count ?? 0);
  }
}
