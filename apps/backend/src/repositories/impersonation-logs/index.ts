import {type Kysely, type Insertable} from 'kysely';
import type {DB, ImpersonationLogs} from '@revendiste/shared';
import {BaseRepository} from '../base';

export class ImpersonationLogsRepository extends BaseRepository<ImpersonationLogsRepository> {
  withTransaction(trx: Kysely<DB>): ImpersonationLogsRepository {
    return new ImpersonationLogsRepository(trx);
  }

  async insertLog(row: Insertable<ImpersonationLogs>) {
    return await this.db
      .insertInto('impersonationLogs')
      .values(row)
      .returning('id')
      .executeTakeFirstOrThrow();
  }
}
