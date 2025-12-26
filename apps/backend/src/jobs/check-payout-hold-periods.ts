import cron from 'node-cron';
import {db} from '~/db';
import {SellerEarningsService} from '~/services/seller-earnings';
import {
  SellerEarningsRepository,
  OrderTicketReservationsRepository,
  ListingTicketsRepository,
} from '~/repositories';
import {logger} from '~/utils';

/**
 * Scheduled job to check and release seller earnings from hold periods
 * Runs hourly to release earnings that have passed their hold period
 *
 * This job:
 * - Finds earnings where hold_until <= NOW() and status = 'pending'
 * - Updates status to 'available' if no reports exist
 * - Updates status to 'retained' if reports/disputes exist (future)
 * - Processes in batches to avoid transactional issues
 *
 * Earnings are held for 48 hours after the event end date to allow for:
 * - Dispute resolution
 * - Fraud detection
 * - Buyer complaints
 */
export function startCheckPayoutHoldPeriodsJob() {
  const sellerEarningsRepository = new SellerEarningsRepository(db);
  const orderTicketReservationsRepository =
    new OrderTicketReservationsRepository(db);
  const listingTicketsRepository = new ListingTicketsRepository(db);

  const sellerEarningsService = new SellerEarningsService(
    sellerEarningsRepository,
    orderTicketReservationsRepository,
    listingTicketsRepository,
  );

  // Run hourly: '0 * * * *'
  // This balances timely release with system load
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Starting scheduled check of payout hold periods...');

      const result = await sellerEarningsService.checkHoldPeriods(100);

      if (result.released > 0 || result.retained > 0) {
        logger.info('Payout hold periods check completed', {
          released: result.released,
          retained: result.retained,
        });
      } else {
        logger.debug('No earnings ready for release');
      }
    } catch (error) {
      logger.error('Error in scheduled payout hold periods check:', error);
    }
  });

  logger.info(
    'Scheduled job: check-payout-hold-periods started (runs hourly)',
  );
}

