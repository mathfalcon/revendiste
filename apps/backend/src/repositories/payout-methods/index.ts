import {Kysely} from 'kysely';
import {DB, EventTicketCurrency, JsonValue} from '@revendiste/shared';
import {BaseRepository} from '../base';

export class PayoutMethodsRepository extends BaseRepository<PayoutMethodsRepository> {
  withTransaction(trx: Kysely<DB>): PayoutMethodsRepository {
    return new PayoutMethodsRepository(trx);
  }

  async create(payoutMethodData: {
    userId: string;
    payoutType: 'uruguayan_bank' | 'paypal';
    accountHolderName: string;
    accountHolderSurname: string;
    currency: EventTicketCurrency;
    isDefault: boolean;
    metadata: JsonValue;
  }) {
    return await this.db
      .insertInto('payoutMethods')
      .values(payoutMethodData)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getByUserId(userId: string) {
    return await this.db
      .selectFrom('payoutMethods')
      .selectAll()
      .where('userId', '=', userId)
      .where('deletedAt', 'is', null)
      .orderBy('isDefault', 'desc')
      .orderBy('createdAt', 'desc')
      .execute();
  }

  async getDefault(userId: string) {
    return await this.db
      .selectFrom('payoutMethods')
      .selectAll()
      .where('userId', '=', userId)
      .where('isDefault', '=', true)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  async setDefault(userId: string, payoutMethodId: string) {
    // First, unset all defaults for this user
    await this.db
      .updateTable('payoutMethods')
      .set({
        isDefault: false,
        updatedAt: new Date(),
      })
      .where('userId', '=', userId)
      .where('deletedAt', 'is', null)
      .execute();

    // Then set the new default
    return await this.db
      .updateTable('payoutMethods')
      .set({
        isDefault: true,
        updatedAt: new Date(),
      })
      .where('id', '=', payoutMethodId)
      .where('userId', '=', userId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }

  async getById(id: string) {
    return await this.db
      .selectFrom('payoutMethods')
      .selectAll()
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  async update(
    id: string,
    updates: {
      accountHolderName?: string;
      accountHolderSurname?: string;
      currency?: EventTicketCurrency;
      isDefault?: boolean;
      metadata?: JsonValue;
    },
  ) {
    return await this.db
      .updateTable('payoutMethods')
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: string) {
    return await this.db
      .updateTable('payoutMethods')
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }
}
