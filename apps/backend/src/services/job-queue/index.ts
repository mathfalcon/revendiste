import { JobPayloadSchema } from '@revendiste/shared';
import { JobsRepository } from '~/repositories/jobs';
import { logger } from '~/utils';

export type JobHandler = (
  payload: Record<string, unknown>,
) => Promise<void>;

/** Module-level instance set by cronjob so NotificationService can enqueue without circular deps */
let jobQueueInstance: JobQueueService | null = null;

export function setJobQueueInstance(instance: JobQueueService): void {
  jobQueueInstance = instance;
}

export function getJobQueueService(): JobQueueService {
  if (!jobQueueInstance) {
    throw new Error(
      'Job queue not initialized. Call setJobQueueInstance() (e.g. via initializeJobQueue()) first.',
    );
  }
  return jobQueueInstance;
}

/**
 * Generic Job Queue Service
 *
 * Usage:
 *   jobQueue.registerHandler('notify-order-confirmed', handler);
 *   await jobQueue.enqueue('notify-order-confirmed', payload, 'notify-order-confirmed:order123');
 *   await jobQueue.processJobs();
 */
export class JobQueueService {
  private handlers: Map<string, JobHandler> = new Map();

  constructor(private readonly jobsRepository: JobsRepository) {}

  /**
   * Register a handler for a job type
   */
  registerHandler(jobType: string, handler: JobHandler): void {
    this.handlers.set(jobType, handler);
    logger.info('Registered job handler', { jobType });
  }

  /**
   * Enqueue a job for async processing
   */
  async enqueue(
    jobType: string,
    payload: Record<string, unknown>,
    idempotencyKey?: string,
    options?: { scheduledAt?: Date; maxAttempts?: number },
  ) {
    const job = await this.jobsRepository.enqueue({
      jobType,
      payload,
      idempotencyKey,
      scheduledAt: options?.scheduledAt,
      maxAttempts: options?.maxAttempts,
    });

    if (job) {
      logger.debug('Job enqueued', {
        jobId: job.id,
        jobType,
        idempotencyKey,
      });
    } else {
      logger.debug('Job already exists (idempotency)', {
        jobType,
        idempotencyKey,
      });
    }

    return job;
  }

  /** Default: reclaim jobs stuck in processing for longer than this (minutes) */
  private static readonly STALE_JOBS_MINUTES = 15;

  /**
   * Process pending jobs until none available (or maxJobsPerRun if set).
   * Reclaims stale processing jobs at the start of each run.
   * Called by cronjob.
   */
  async processJobs(options?: { maxJobsPerRun?: number }): Promise<number> {
    const reclaimed = await this.jobsRepository.reclaimStaleJobs({
      olderThanMinutes: JobQueueService.STALE_JOBS_MINUTES,
    });
    if (reclaimed > 0) {
      logger.info('Reclaimed stale jobs', { count: reclaimed });
    }

    const maxJobs = options?.maxJobsPerRun;
    let processedCount = 0;

    while (true) {
      if (maxJobs !== undefined && processedCount >= maxJobs) break;

      const job = await this.jobsRepository.claimJob();

      if (!job) {
        break;
      }

      const handler = this.handlers.get(job.jobType);

      if (!handler) {
        logger.error('No handler registered for job type', {
          jobId: job.id,
          jobType: job.jobType,
        });
        await this.jobsRepository.markFailed(
          job.id,
          `No handler for job type: ${job.jobType}`,
          job.attempts,
          job.maxAttempts,
        );
        processedCount++;
        continue;
      }

      const parseResult = JobPayloadSchema.safeParse({
        job_type: job.jobType,
        payload: job.payload,
      });

      if (!parseResult.success) {
        const message = parseResult.error.issues
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join('; ');
        logger.error('Job payload validation failed', {
          jobId: job.id,
          jobType: job.jobType,
          errors: message,
        });
        await this.jobsRepository.markFailed(
          job.id,
          `Invalid payload: ${message}`,
          job.attempts,
          job.maxAttempts,
        );
        processedCount++;
        continue;
      }

      try {
        await handler(parseResult.data.payload as Record<string, unknown>);
        await this.jobsRepository.markCompleted(job.id);

        logger.info('Job completed', {
          jobId: job.id,
          jobType: job.jobType,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        await this.jobsRepository.markFailed(
          job.id,
          errorMessage,
          job.attempts,
          job.maxAttempts,
        );

        logger.error('Job failed', {
          jobId: job.id,
          jobType: job.jobType,
          attempt: job.attempts + 1,
          maxAttempts: job.maxAttempts,
          error: errorMessage,
        });
      }

      processedCount++;
    }

    return processedCount;
  }
}
