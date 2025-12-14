import cron from 'node-cron';
import {db} from '~/db';
import {NotificationService} from '~/services/notifications';
import {logger} from '~/utils';
import {UsersRepository} from '~/repositories';

/**
 * Scheduled job to process pending notifications
 * Runs every 5 minutes to send pending notifications through their configured channels
 *
 * This job:
 * - Finds notifications with status 'pending'
 * - Sends them through configured channels (email, SMS, etc.)
 * - Updates status to 'sent' or 'failed' accordingly
 *
 * This ensures notifications are sent even if the initial send attempt failed
 * or if notifications were created while the system was processing other requests.
 */
export function startProcessPendingNotificationsJob() {
  const notificationService = new NotificationService(
    db,
    new UsersRepository(db),
  );

  // Run every 5 minutes: '*/5 * * * *'
  // This balances timely delivery with system load
  cron.schedule('*/5 * * * *', async () => {
    try {
      logger.info('Starting scheduled processing of pending notifications...');

      const processedCount = await notificationService.processPendingNotifications(
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
    }
  });

  logger.info(
    'Scheduled job: process-pending-notifications started (runs every 5 minutes)',
  );
}

