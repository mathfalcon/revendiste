import {Kysely} from 'kysely';
import {DB} from '~/types';

/**
 * Base repository class that provides transaction utilities
 * All repositories should extend this class
 */
export abstract class BaseRepository<T extends BaseRepository<T>> {
  constructor(protected readonly db: Kysely<DB>) {}

  /**
   * Gets the internal database instance
   * Useful for services that need to execute transactions across multiple repositories
   */
  getDb(): Kysely<DB> {
    return this.db;
  }

  /**
   * Executes a transaction with this repository's database instance
   * @param callback - Function that receives a transaction instance
   * @returns Promise that resolves to the callback's return value
   */
  async executeTransaction<U>(
    callback: (trx: Kysely<DB>) => Promise<U>,
  ): Promise<U> {
    return await this.db.transaction().execute(callback);
  }

  /**
   * Creates a new instance of this repository with a transaction context
   * @param trx - Transaction instance to use instead of the default db
   * @returns New repository instance using the transaction
   */
  abstract withTransaction(trx: Kysely<DB>): T;
}
