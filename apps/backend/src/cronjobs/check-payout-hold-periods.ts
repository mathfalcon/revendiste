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
 * Runs the check payout hold periods job logic once
 * Used by production EventBridge + ECS RunTask
 */
export async function runCheckPayoutHoldPeriods() {
  const sellerEarningsRepository = new SellerEarningsRepository(db);
  const orderTicketReservationsRepository =
    new OrderTicketReservationsRepository(db);
  const listingTicketsRepository = new ListingTicketsRepository(db);

  const sellerEarningsService = new SellerEarningsService(
    sellerEarningsRepository,
    orderTicketReservationsRepository,
    listingTicketsRepository,
  );

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
    throw error;
  }
}

/**
 * Starts the cron scheduler for check payout hold periods job
 * Only used in development/local environments
 * In production, use runCheckPayoutHoldPeriods() via EventBridge
 */
export function startCheckPayoutHoldPeriodsJob() {
  const job = cron.schedule('0 * * * *', async () => {
    try {
      await runCheckPayoutHoldPeriods();
    } catch (error) {
      logger.error('Error in scheduled payout hold periods check:', error);
    }
  });

  logger.info(
    'Scheduled job: check-payout-hold-periods started (runs hourly)',
  );

  return job;
}

