#!/usr/bin/env node
/**
 * Standalone script runner for cronjobs in production
 * Usage: node dist/scripts/run-job.js <job-name>
 *
 * This script runs a job once and exits, designed for EventBridge + ECS RunTask
 */

import {logger} from '~/utils';

const jobName = process.argv[2];

if (!jobName) {
  logger.error('Job name is required');
  logger.info('Usage: node dist/scripts/run-job.js <job-name>');
  logger.info('Available jobs:');
  logger.info('  - sync-payments-and-expire-orders');
  logger.info('  - notify-upload-availability');
  logger.info('  - check-payout-hold-periods');
  logger.info('  - process-pending-notifications');
  logger.info('  - scrape-events');
  process.exit(1);
}

async function runJob() {
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

      case 'scrape-events': {
        const {runScrapeEvents} = await import('~/cronjobs/scrape-events');
        await runScrapeEvents();
        break;
      }

      default:
        logger.error(`Unknown job: ${jobName}`);
        process.exit(1);
    }

    logger.info(`Job completed successfully: ${jobName}`);
    process.exit(0);
  } catch (error) {
    logger.error(`Job failed: ${jobName}`, error);
    process.exit(1);
  }
}

runJob();

