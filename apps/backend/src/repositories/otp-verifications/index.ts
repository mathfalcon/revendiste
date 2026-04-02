import {type Kysely} from 'kysely';
import type {DB} from '@revendiste/shared';
import {BaseRepository} from '../base';

export class OtpVerificationsRepository extends BaseRepository<OtpVerificationsRepository> {
  withTransaction(trx: Kysely<DB>): OtpVerificationsRepository {
    return new OtpVerificationsRepository(trx);
  }

  async create(data: {
    userId: string;
    phoneNumber: string;
    codeHash: string;
    expiresAt: Date;
  }) {
    const [row] = await this.db
      .insertInto('otpVerifications')
      .values({
        userId: data.userId,
        phoneNumber: data.phoneNumber,
        codeHash: data.codeHash,
        expiresAt: data.expiresAt,
      })
      .returningAll()
      .execute();

    return row;
  }

  /** Find the most recent non-expired, non-verified OTP for a user */
  async findLatestActive(userId: string) {
    return await this.db
      .selectFrom('otpVerifications')
      .selectAll()
      .where('userId', '=', userId)
      .where('verified', '=', false)
      .where('expiresAt', '>', new Date())
      .orderBy('createdAt', 'desc')
      .executeTakeFirst();
  }

  async incrementAttempts(id: string) {
    await this.db
      .updateTable('otpVerifications')
      .set(eb => ({attempts: eb('attempts', '+', 1)}))
      .where('id', '=', id)
      .execute();
  }

  async markVerified(id: string) {
    await this.db
      .updateTable('otpVerifications')
      .set({verified: true})
      .where('id', '=', id)
      .execute();
  }

  /** Count OTP requests for a user since a given time (for rate limiting) */
  async countRecentByUser(userId: string, since: Date) {
    const result = await this.db
      .selectFrom('otpVerifications')
      .select(eb => eb.fn.countAll<number>().as('count'))
      .where('userId', '=', userId)
      .where('createdAt', '>=', since)
      .executeTakeFirst();

    return result?.count ?? 0;
  }
}
