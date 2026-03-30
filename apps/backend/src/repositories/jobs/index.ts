import { Kysely, sql } from 'kysely';
import { DB, type Json } from '@revendiste/shared';
import { BaseRepository } from '../base';

export interface EnqueueJobData {
  jobType: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
  scheduledAt?: Date;
  maxAttempts?: number;
}

export class JobsRepository extends BaseRepository<JobsRepository> {
  withTransaction(trx: Kysely<DB>): JobsRepository {
    return new JobsRepository(trx);
  }

  /**
   * Enqueue a new job. Uses idempotency_key to prevent duplicates.
   */
  async enqueue(data: EnqueueJobData) {
    return await this.db
      .insertInto('jobs')
      .values({
        jobType: data.jobType,
        payload: data.payload as Json,
        idempotencyKey: data.idempotencyKey ?? null,
        scheduledAt: data.scheduledAt ?? new Date(),
        maxAttempts: data.maxAttempts ?? 5,
      })
      .onConflict(oc => oc.column('idempotencyKey').doNothing())
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Claim a pending job using SKIP LOCKED pattern.
   * Optionally filter by job type.
   */
  async claimJob(jobType?: string) {
    let subquery = this.db
      .selectFrom('jobs')
      .select('id')
      .where('status', '=', 'pending')
      .where('scheduledAt', '<=', new Date())
      .where(eb => eb('attempts', '<', eb.ref('maxAttempts')))
      .orderBy('scheduledAt')
      .limit(1)
      .forUpdate()
      .skipLocked();

    if (jobType) {
      subquery = subquery.where('jobType', '=', jobType);
    }

    return await this.db
      .updateTable('jobs')
      .set({
        status: 'processing',
        startedAt: new Date(),
      })
      .where('id', 'in', subquery)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Mark job as completed
   */
  async markCompleted(id: string) {
    return await this.db
      .updateTable('jobs')
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where('id', '=', id)
      .execute();
  }

  /**
   * Mark job as failed with exponential backoff.
   * Backoff: 1min, 2min, 4min, 8min, 16min
   */
  async markFailed(
    id: string,
    error: string,
    currentAttempts: number,
    maxAttempts: number,
  ) {
    const backoffMinutes = Math.pow(2, currentAttempts);
    const nextScheduledAt = new Date(
      Date.now() + backoffMinutes * 60 * 1000,
    );
    const isFinalFailure = currentAttempts + 1 >= maxAttempts;

    return await this.db
      .updateTable('jobs')
      .set({
        status: isFinalFailure ? 'failed' : 'pending',
        attempts: currentAttempts + 1,
        scheduledAt: nextScheduledAt,
        error,
      })
      .where('id', '=', id)
      .execute();
  }

  /**
   * Reclaim jobs stuck in processing (e.g. worker died). Sets them back to pending
   * so another run can pick them up.
   */
  async reclaimStaleJobs(options: { olderThanMinutes: number }) {
    const cutoff = new Date(
      Date.now() - options.olderThanMinutes * 60 * 1000,
    );
    const result = await this.db
      .updateTable('jobs')
      .set({ status: 'pending', startedAt: null })
      .where('status', '=', 'processing')
      .where('startedAt', '<', cutoff)
      .executeTakeFirst();
    return Number(result.numUpdatedRows ?? 0);
  }

  /**
   * Get failed jobs for monitoring/alerting
   */
  async getFailedJobs(limit: number = 100) {
    return await this.db
      .selectFrom('jobs')
      .selectAll()
      .where('status', '=', 'failed')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .execute();
  }
}
