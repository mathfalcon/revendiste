/**
 * Single entry point for running scheduled cronjob logic once.
 * Used by the ECS `run-job` script and admin manual triggers.
 */
export const SCHEDULED_CRONJOB_NAMES = [
  'sync-payments-and-expire-orders',
  'notify-upload-availability',
  'check-payout-hold-periods',
  'process-pending-notifications',
  'process-pending-jobs',
  'scrape-events',
] as const;

export type ScheduledCronjobName = (typeof SCHEDULED_CRONJOB_NAMES)[number];

export function isScheduledCronjobName(
  value: string,
): value is ScheduledCronjobName {
  return (SCHEDULED_CRONJOB_NAMES as readonly string[]).includes(value);
}

export async function runScheduledJobOnce(
  jobName: ScheduledCronjobName,
): Promise<void> {
  switch (jobName) {
    case 'sync-payments-and-expire-orders': {
      const {runSyncPaymentsAndExpireOrders} = await import(
        '~/cronjobs/sync-payments-and-expire-orders'
      );
      await runSyncPaymentsAndExpireOrders();
      return;
    }
    case 'notify-upload-availability': {
      const {runNotifyUploadAvailability} = await import(
        '~/cronjobs/notify-upload-availability'
      );
      await runNotifyUploadAvailability();
      return;
    }
    case 'check-payout-hold-periods': {
      const {runCheckPayoutHoldPeriods} = await import(
        '~/cronjobs/check-payout-hold-periods'
      );
      await runCheckPayoutHoldPeriods();
      return;
    }
    case 'process-pending-notifications': {
      const {runProcessPendingNotifications} = await import(
        '~/cronjobs/process-pending-notifications'
      );
      await runProcessPendingNotifications();
      return;
    }
    case 'process-pending-jobs': {
      const {
        initializeJobQueue,
        runProcessPendingJobs,
      } = await import('~/cronjobs/process-pending-jobs');
      initializeJobQueue();
      await runProcessPendingJobs();
      return;
    }
    case 'scrape-events': {
      const {runScrapeEvents} = await import('~/cronjobs/scrape-events');
      await runScrapeEvents();
      return;
    }
    default: {
      const _exhaustive: never = jobName;
      throw new Error(`Unhandled cronjob: ${_exhaustive}`);
    }
  }
}
