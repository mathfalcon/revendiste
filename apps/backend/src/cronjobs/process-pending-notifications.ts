import cron from 'node-cron';
import {db} from '~/db';
import {NotificationService} from '~/services/notifications';
import {logger} from '~/utils';
import {UsersRepository} from '~/repositories';

/**
 * Runs the process pending notifications job logic once
 * Used by production EventBridge + ECS RunTask
 */
export async function runProcessPendingNotifications() {
  const notificationService = new NotificationService(
    db,
    new UsersRepository(db),
  );

  try {
    logger.info('Starting scheduled processing of pending notifications...');

    const processedCount =
      await notificationService.processPendingNotifications(
        100, // Process up to 100 notifications per run
      );

    if (processedCount > 0) {
      logger.info('Pending notifications processing completed', {
        processedCount,
      });
    } else {
      logger.debug('No pending notifications to process');
    }
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
