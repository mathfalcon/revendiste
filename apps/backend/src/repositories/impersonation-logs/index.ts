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

  /**
   * Returns true if the given target user has an impersonation log entry
   * created within the last `withinMinutes` minutes. Used to suppress side
   * effects (e.g. Clerk's new-device-sign-in email) that fire when an admin
   * starts an impersonation session.
   */
  async hasRecentByTargetUserId(
    targetUserId: string,
    withinMinutes: number,
  ): Promise<boolean> {
    const since = new Date(Date.now() - withinMinutes * 60 * 1000);
    const row = await this.db
      .selectFrom('impersonationLogs')
      .select('id')
      .where('targetUserId', '=', targetUserId)
      .where('createdAt', '>=', since)
      .limit(1)
      .executeTakeFirst();
    return !!row;
  }
}
