import cron from 'node-cron';
import {db} from '~/db';
import {OrderTicketReservationsRepository} from '~/repositories/order-ticket-reservations';
import {logger} from '~/utils';

/**
 * Scheduled job to clean up expired ticket reservations
 * Runs every 2 minutes to ensure expired reservations are cleaned up promptly
 *
 * This is a safety net - expired reservations are also cleaned up on-demand
 * when creating new orders, but this job ensures they don't accumulate
 * even if there's low order activity.
 */
export function startCleanupExpiredReservationsJob() {
  const reservationsRepo = new OrderTicketReservationsRepository(db);

  // Run every 2 minutes: '*/2 * * * *'
  // This balances freshness with database load
  cron.schedule('*/2 * * * *', async () => {
    try {
      logger.info('Starting scheduled cleanup of expired reservations...');
      const result = await reservationsRepo.cleanupExpiredReservations();
      const cleanedCount = result.length;

      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} expired reservation(s)`);
      } else {
        logger.debug('No expired reservations to clean up');
      }
    } catch (error) {
      logger.error('Error cleaning up expired reservations:', error);
    }
  });

  logger.info(
    'Scheduled job: cleanup-expired-reservations started (runs every 2 minutes)',
  );
}
