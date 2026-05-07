import cron from 'node-cron';
import {db} from '~/db';
import {SellerEarningsService} from '~/services/seller-earnings';
import {TicketReportsService} from '~/services/ticket-reports';
import {NotificationService} from '~/services/notifications';
import {DLocalService} from '~/services/dlocal';
import {
  SellerEarningsRepository,
  OrderTicketReservationsRepository,
  OrdersRepository,
  NotificationsRepository,
  NotificationBatchesRepository,
  UsersRepository,
  TicketReportsRepository,
  TicketReportActionsRepository,
  TicketReportRefundsRepository,
  TicketReportAttachmentsRepository,
  PaymentsRepository,
  TicketDocumentsRepository,
} from '~/repositories';
import {
  SELLER_EARNINGS_HOLD_PERIOD_BATCH_SIZE,
  SELLER_EARNINGS_MISSING_DOCS_BATCH_SIZE,
} from '~/constants/limits';
import {logger} from '~/utils';
import {redactKnownSecrets, wideEvent, withDuration} from '~/utils/logFields';
import {getStorageProvider} from '~/services/storage/StorageFactory';

/**
 * Runs the check payout hold periods job logic once
 * Used by production EventBridge + ECS RunTask
 *
 * This job performs two checks:
 * 1. Check for missing documents after event end (marks earnings as retained, notifies users)
 * 2. Release hold periods for pending earnings (marks as available)
 */
export async function runCheckPayoutHoldPeriods() {
  const jobStartedAt = Date.now();
  const jobName = 'check-payout-hold-periods';

  const sellerEarningsRepository = new SellerEarningsRepository(db);
  const orderTicketReservationsRepository =
    new OrderTicketReservationsRepository(db);
  const notificationsRepository = new NotificationsRepository(db);
  const usersRepository = new UsersRepository(db);
  const notificationBatchesRepository = new NotificationBatchesRepository(db);

  const notificationService = new NotificationService(
    notificationsRepository,
    usersRepository,
    notificationBatchesRepository,
  );

  const ticketReportsService = new TicketReportsService(
    new TicketReportsRepository(db),
    new TicketReportActionsRepository(db),
    new TicketReportRefundsRepository(db),
    new TicketReportAttachmentsRepository(db),
    orderTicketReservationsRepository,
    new OrdersRepository(db),
    new PaymentsRepository(db),
    new TicketDocumentsRepository(db),
    notificationService,
    new DLocalService(),
    getStorageProvider(),
    sellerEarningsRepository,
  );

  const sellerEarningsService = new SellerEarningsService(
    sellerEarningsRepository,
    orderTicketReservationsRepository,
    notificationService,
    ticketReportsService,
  );

  try {
    // Check 1: Handle missing documents immediately at event end
    // This MUST run before checkHoldPeriods() so retained earnings are skipped
    const missingDocsResult =
      await sellerEarningsService.checkMissingDocumentsAfterEventEnd(
        SELLER_EARNINGS_MISSING_DOCS_BATCH_SIZE,
      );

    if (missingDocsResult.processed > 0) {
      logger.debug('Processed missing documents after event end', {
        processed: missingDocsResult.processed,
      });
    }

    // Check 2: Release hold periods (existing logic)
    const holdPeriodsResult = await sellerEarningsService.checkHoldPeriods(
      SELLER_EARNINGS_HOLD_PERIOD_BATCH_SIZE,
    );

    const itemsProcessed =
      missingDocsResult.processed +
      holdPeriodsResult.released +
      holdPeriodsResult.retained;

    logger.info(
      'cron.check-payout-hold-periods',
      wideEvent('cron.check-payout-hold-periods', {
        jobName,
        itemsProcessed,
        itemsSucceeded: itemsProcessed,
        itemsFailed: 0,
        missingDocsProcessed: missingDocsResult.processed,
        earningsReleased: holdPeriodsResult.released,
        earningsRetained: holdPeriodsResult.retained,
        ...withDuration(jobStartedAt),
        outcome: 'success',
      }),
    );
  } catch (error) {
    logger.error(
      'cron.check-payout-hold-periods',
      wideEvent('cron.check-payout-hold-periods', {
        jobName,
        itemsProcessed: 0,
        itemsSucceeded: 0,
        itemsFailed: 1,
        error: redactKnownSecrets(
          error instanceof Error
            ? {message: error.message, stack: error.stack}
            : {message: String(error)},
        ),
        ...withDuration(jobStartedAt),
        outcome: 'failure',
      }),
    );
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

  logger.info('Scheduled job: check-payout-hold-periods started (runs hourly)');

  return job;
}
