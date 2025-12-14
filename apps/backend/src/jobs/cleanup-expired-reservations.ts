import cron from 'node-cron';
import {db} from '~/db';
import {OrderCleanupService} from '~/services/orders/cleanup';
import {logger} from '~/utils';

/**
 * Scheduled job to clean up expired orders and their ticket reservations
 * Runs every 2 minutes to ensure expired orders are marked properly
 *
 * This job:
 * - Finds orders that have passed their reservation expiration time
 * - Updates order status to 'expired'
 * - Releases associated ticket reservations
 *
 * This is a safety net - payment webhooks also handle order expiration,
 * but this job ensures orders expire even if a webhook is missed or delayed.
 */
export function startCleanupExpiredReservationsJob() {
  const cleanupService = new OrderCleanupService(db);

  // Run every 2 minutes: '*/2 * * * *'
  // This balances freshness with database load
  cron.schedule('*/2 * * * *', async () => {
    try {
      logger.info('Starting scheduled cleanup of expired orders...');

      const result = await cleanupService.processExpiredOrders();

      if (result.processedCount > 0) {
        logger.info('Expired orders cleanup completed', {
          processedCount: result.processedCount,
          orderIds: result.orderIds,
        });
      } else {
        logger.debug('No expired orders to process');
      }
    } catch (error) {
      logger.error('Error in scheduled expired orders cleanup:', error);
    }
  });

  logger.info(
    'Scheduled job: cleanup-expired-orders started (runs every 2 minutes)',
  );
}
