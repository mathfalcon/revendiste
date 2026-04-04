#!/usr/bin/env node
/**
 * Standalone script runner for cronjobs in production
 * Usage: node dist/scripts/run-job.js <job-name>
 *
 * This script runs a job once and exits, designed for EventBridge + ECS RunTask
 */

import {logger} from '~/utils';
import {initOtel, shutdownOtel} from '~/lib/otel';

const jobName = process.argv[2];

if (!jobName) {
  logger.error('Job name is required');
  logger.info('Usage: node dist/scripts/run-job.js <job-name>');
  logger.info('Available jobs:');
  logger.info('  - sync-payments-and-expire-orders');
  logger.info('  - notify-upload-availability');
  logger.info('  - check-payout-hold-periods');
  logger.info('  - process-pending-notifications');
  logger.info('  - process-pending-jobs');
  logger.info('  - scrape-events');
  process.exit(1);
}

/**
 * Format duration in a human-readable way
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

async function runJob() {
  // Initialize OTel with job-specific service name so logs are distinguishable in PostHog
  initOtel(`revendiste-cronjob-${jobName}`);

  const startTime = Date.now();

  try {
    logger.info(`Starting job: ${jobName}`);

    switch (jobName) {
      case 'sync-payments-and-expire-orders': {
        const {runSyncPaymentsAndExpireOrders} = await import(
          '~/cronjobs/sync-payments-and-expire-orders'
        );
        await runSyncPaymentsAndExpireOrders();
        break;
      }

      case 'notify-upload-availability': {
        const {runNotifyUploadAvailability} = await import(
          '~/cronjobs/notify-upload-availability'
        );
        await runNotifyUploadAvailability();
        break;
      }

      case 'check-payout-hold-periods': {
        const {runCheckPayoutHoldPeriods} = await import(
          '~/cronjobs/check-payout-hold-periods'
        );
        await runCheckPayoutHoldPeriods();
        break;
      }

      case 'process-pending-notifications': {
        const {runProcessPendingNotifications} = await import(
          '~/cronjobs/process-pending-notifications'
        );
        await runProcessPendingNotifications();
        break;
      }

      case 'process-pending-jobs': {
        const {
          initializeJobQueue,
          runProcessPendingJobs,
        } = await import('~/cronjobs/process-pending-jobs');
        initializeJobQueue();
        await runProcessPendingJobs();
        break;
      }

      case 'scrape-events': {
        const {runScrapeEvents} = await import('~/cronjobs/scrape-events');
        await runScrapeEvents();
        break;
      }

      default:
        logger.error(`Unknown job: ${jobName}`);
        process.exit(1);
    }

    const duration = Date.now() - startTime;
    logger.info(`Job completed successfully: ${jobName}`, {
      durationMs: duration,
      duration: formatDuration(duration),
    });
    await shutdownOtel();
    process.exit(0);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Job failed: ${jobName}`, {
      error,
      durationMs: duration,
      duration: formatDuration(duration),
    });
    await shutdownOtel();
    process.exit(1);
  }
}

runJob();

