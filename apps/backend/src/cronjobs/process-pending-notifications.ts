import cron from 'node-cron';
import {db} from '~/db';
import {NotificationService} from '~/services/notifications';
import {logger} from '~/utils';
import {
  UsersRepository,
  NotificationsRepository,
  NotificationBatchesRepository,
} from '~/repositories';

// Create shared repositories and services
const usersRepository = new UsersRepository(db);
const notificationsRepository = new NotificationsRepository(db);
const notificationBatchesRepository = new NotificationBatchesRepository(db);
const notificationService = new NotificationService(
  notificationsRepository,
  usersRepository,
  notificationBatchesRepository,
);

/**
 * Runs the process pending notifications job logic once
 * Used by production EventBridge + ECS RunTask
 *
 * This job processes:
 * 1. Pending notification batches (debounced notifications where window has ended)
 * 2. Pending individual notifications (retry logic for failed sends)
 */
export async function runProcessPendingNotifications() {
  try {
    logger.info('Starting scheduled processing of pending notifications...');

    // 1. Process pending notification batches first
    // These are debounced notifications that have been waiting for their time window to end
    const batchesProcessed = await notificationService.processPendingBatches(
      50, // Process up to 50 batches per run
    );

    if (batchesProcessed > 0) {
      logger.info('Pending notification batches processed', {
        batchesProcessed,
      });
    } else {
      logger.debug('No pending notification batches to process');
    }

    // 2. Process pending individual notifications (retry failed sends)
    const notificationsProcessed =
      await notificationService.processPendingNotifications(
        100, // Process up to 100 notifications per run
      );

    if (notificationsProcessed > 0) {
      logger.info('Pending notifications processing completed', {
        notificationsProcessed,
      });
    } else {
      logger.debug('No pending notifications to process');
    }

    logger.info('All pending notification processing completed', {
      batchesProcessed,
      notificationsProcessed,
    });
  } catch (error) {
    logger.error('Error in scheduled pending notifications processing:', error);
    throw error;
  }
}

/**
 * Starts the cron scheduler for process pending notifications job
 * Only used in development/local environments
 * In production, use runProcessPendingNotifications() via EventBridge
 */
export function startProcessPendingNotificationsJob() {
  const job = cron.schedule('*/5 * * * *', async () => {
    try {
      await runProcessPendingNotifications();
    } catch (error) {
      logger.error(
        'Error in scheduled pending notifications processing:',
        error,
      );
    }
  });

  logger.info(
    'Scheduled job: process-pending-notifications started (runs every 5 minutes)',
  );

  return job;
}
