import cron from 'node-cron';
import {db} from '~/db';
import {
  PaymentsRepository,
  OrdersRepository,
  OrderTicketReservationsRepository,
  UsersRepository,
  NotificationsRepository,
  PaymentEventsRepository,
  ListingTicketsRepository,
  TicketListingsRepository,
  EventsRepository,
  EventTicketWavesRepository,
  SellerEarningsRepository,
} from '~/repositories';
import {PaymentWebhookAdapter} from '~/services/payments/adapters';
import {getPaymentProvider} from '~/services/payments/providers/PaymentProviderFactory';
import {NotificationService} from '~/services/notifications';
import {TicketListingsService} from '~/services/ticket-listings';
import {SellerEarningsService} from '~/services/seller-earnings';
import {notifyOrderExpired} from '~/services/notifications/helpers';
import {expireOrderWithoutPaymentLink} from '~/services/orders/reservation-expiry';
import {logger} from '~/utils';
import {redactKnownSecrets, wideEvent, withDuration} from '~/utils/logFields';
import {Payment} from '~/types';
import {getJobQueueService} from '~/services/job-queue';
import {
  FORCE_EXPIRATION_GRACE_MINUTES,
  PAYMENT_EXTENSION_WINDOW_MINUTES,
} from '~/constants/reservation';

// Create shared repositories
const ordersRepository = new OrdersRepository(db);
const orderTicketReservationsRepository = new OrderTicketReservationsRepository(
  db,
);
const paymentsRepository = new PaymentsRepository(db);
const paymentEventsRepository = new PaymentEventsRepository(db);
const listingTicketsRepository = new ListingTicketsRepository(db);
const ticketListingsRepository = new TicketListingsRepository(db);
const eventsRepository = new EventsRepository(db);
const eventTicketWavesRepository = new EventTicketWavesRepository(db);
const usersRepository = new UsersRepository(db);
const notificationsRepository = new NotificationsRepository(db);
const sellerEarningsRepository = new SellerEarningsRepository(db);

// Create shared services
const notificationService = new NotificationService(
  notificationsRepository,
  usersRepository,
);

const ticketListingsService = new TicketListingsService(
  ticketListingsRepository,
  eventsRepository,
  eventTicketWavesRepository,
  listingTicketsRepository,
  ordersRepository,
  usersRepository,
  notificationService,
);

const sellerEarningsService = new SellerEarningsService(
  sellerEarningsRepository,
  orderTicketReservationsRepository,
);

const orderReservationExpiryDeps = {
  ordersRepository,
  orderTicketReservationsRepository,
  paymentsRepository,
  notificationService,
};

// Create adapter factory function for payment sync
const createPaymentWebhookAdapter = (
  provider: Parameters<typeof getPaymentProvider>[0],
) => {
  const paymentProvider = getPaymentProvider(provider);
  return new PaymentWebhookAdapter(
    paymentProvider,
    ordersRepository,
    orderTicketReservationsRepository,
    paymentsRepository,
    paymentEventsRepository,
    listingTicketsRepository,
    ticketListingsRepository,
    ticketListingsService,
    sellerEarningsService,
    notificationService,
    () => getJobQueueService(),
  );
};

/**
 * Processes a single payment status sync
 */
async function processPaymentSync(
  payment: Pick<Payment, 'id' | 'provider' | 'providerPaymentId'>,
): Promise<{success: boolean; paymentId: string}> {
  try {
    const adapter = createPaymentWebhookAdapter(payment.provider);
    await adapter.syncPaymentStatus(payment.providerPaymentId);

    const fresh = await paymentsRepository.getById(payment.id);
    if (fresh?.providerPaymentId) {
      const isStillPending =
        fresh.status === 'pending' || fresh.status === 'processing';
      if (isStillPending) {
        const createdAt = new Date(fresh.createdAt).getTime();
        const minAgeMs =
          (PAYMENT_EXTENSION_WINDOW_MINUTES + FORCE_EXPIRATION_GRACE_MINUTES) *
          60 *
          1000;
        if (Date.now() - createdAt >= minAgeMs) {
          const provider = getPaymentProvider(payment.provider);
          const raw = await provider.getPayment(fresh.providerPaymentId);
          await provider.forceExpirationCheck?.(raw);
        }
      }
    }

    logger.debug('Payment status synced successfully', {
      paymentId: payment.id,
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
    });

    return {success: true, paymentId: payment.id};
  } catch (error) {
    logger.error('Failed to sync payment status', {
      paymentId: payment.id,
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {success: false, paymentId: payment.id};
  }
}

/**
 * Expires a single order and releases its reservations.
 * Only runs if the order is still pending (skips if user already cancelled).
 */
async function expireOrder(
  orderId: string,
  reason: 'all_payments_failed' | 'no_payment_created',
  paymentIds: string[],
): Promise<void> {
  const expireStartedAt = Date.now();
  let didExpire = false;

  await ordersRepository.executeTransaction(async trx => {
    const ordersRepo = ordersRepository.withTransaction(trx);
    const reservationsRepo =
      orderTicketReservationsRepository.withTransaction(trx);

    // Only expire if still pending (user may have cancelled via UI)
    const order = await trx
      .selectFrom('orders')
      .select(['id', 'status'])
      .where('id', '=', orderId)
      .where('status', '=', 'pending')
      .where('deletedAt', 'is', null)
      .forUpdate()
      .executeTakeFirst();

    if (!order) {
      logger.debug(
        'Order no longer pending (e.g. already cancelled), skipping expiration',
        {
          orderId,
        },
      );
      return;
    }

    await ordersRepo.updateStatus(orderId, 'expired', {
      cancelledAt: new Date(),
    });
    await reservationsRepo.releaseByOrderId(orderId);

    didExpire = true;
  });

  if (!didExpire) return;

  logger.info(
    'orders.expired',
    wideEvent('orders.expired', {
      orderId,
      reason:
        reason === 'all_payments_failed'
          ? ('all_payments_terminal' as const)
          : ('no_payment_link' as const),
      paymentIds,
      ...withDuration(expireStartedAt),
      outcome: 'success',
    }),
  );

  const orderWithItems = await ordersRepository.getByIdWithItems(orderId);

  if (orderWithItems && orderWithItems.event) {
    notifyOrderExpired(notificationService, {
      buyerUserId: orderWithItems.userId,
      orderId: orderWithItems.id,
      eventName: orderWithItems.event.name || 'el evento',
      eventEndDate: orderWithItems.event.eventEndDate ?? null,
    }).catch(error => {
      logger.error('Failed to send order expired notification', {
        orderId,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }
}

/**
 * Runs the sync payments and expire orders job logic once
 * Used by production EventBridge + ECS RunTask
 */
export async function runSyncPaymentsAndExpireOrders() {
  const jobStartedAt = Date.now();
  const jobName = 'sync-payments-and-expire-orders';

  let syncSuccessCount = 0;
  let syncErrorCount = 0;
  let expiredCount = 0;
  let orderCheckErrors = 0;
  let pendingPaymentsCount = 0;
  let pendingOrdersCount = 0;

  try {
    const pendingPayments = await paymentsRepository.getPendingPaymentsForSync({
      minAgeMinutes: 5,
      limit: 500,
    });
    pendingPaymentsCount = pendingPayments.length;

    if (pendingPayments.length > 0) {
      const BATCH_SIZE = 25;

      for (let i = 0; i < pendingPayments.length; i += BATCH_SIZE) {
        const batch = pendingPayments.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(payment => processPaymentSync(payment)),
        );

        for (const result of results) {
          if (result.status === 'fulfilled') {
            if (result.value.success) {
              syncSuccessCount++;
            } else {
              syncErrorCount++;
            }
          } else {
            syncErrorCount++;
            logger.error('Payment sync promise rejected', {
              error: redactKnownSecrets(result.reason),
            });
          }
        }

        logger.debug('Processed payment batch', {
          batchNumber: Math.floor(i / BATCH_SIZE) + 1,
          batchSize: batch.length,
          totalBatches: Math.ceil(pendingPayments.length / BATCH_SIZE),
        });
      }
    } else {
      logger.debug('No pending payments to sync');
    }

    const now = new Date();

    const pendingOrders = await db
      .selectFrom('orders')
      .select(['id', 'reservationExpiresAt'])
      .where('status', '=', 'pending')
      .where('deletedAt', 'is', null)
      .execute();
    pendingOrdersCount = pendingOrders.length;

    if (pendingOrders.length > 0) {
      logger.debug('Checking pending orders for expiration', {
        count: pendingOrders.length,
      });

      for (const order of pendingOrders) {
        try {
          const payments = await paymentsRepository.getAllByOrderId(order.id);

          if (payments.length === 0) {
            const reservationExpired =
              order.reservationExpiresAt &&
              new Date(order.reservationExpiresAt) < now;

            if (reservationExpired) {
              logger.debug(
                'Expiring order with no payment link (reservation expired)',
                {
                  orderId: order.id,
                  reservationExpiresAt: order.reservationExpiresAt,
                },
              );

              const expired = await expireOrderWithoutPaymentLink(
                order.id,
                orderReservationExpiryDeps,
              );
              if (expired) {
                expiredCount++;
              }
            } else {
              logger.debug('Order without payment, reservation still valid', {
                orderId: order.id,
                reservationExpiresAt: order.reservationExpiresAt,
              });
            }
            continue;
          }

          const terminalFailureStates = ['expired', 'failed', 'cancelled'];
          const allPaymentsTerminal = payments.every(p =>
            terminalFailureStates.includes(p.status),
          );
          const hasPaidPayment = payments.some(p => p.status === 'paid');

          if (allPaymentsTerminal && !hasPaidPayment) {
            logger.debug('Expiring order based on payment provider status', {
              orderId: order.id,
            });

            await expireOrder(
              order.id,
              'all_payments_failed',
              payments.map(p => p.id),
            );
            expiredCount++;
          }
        } catch (error: unknown) {
          orderCheckErrors++;
          logger.error('Error checking order for expiration', {
            orderId: order.id,
            error:
              error instanceof Error
                ? error.message
                : redactKnownSecrets(error),
          });
        }
      }

      if (expiredCount === 0) {
        logger.debug('No orders expired');
      }
    } else {
      logger.debug('No pending orders to check for expiration');
    }

    const itemsProcessed = pendingPaymentsCount + pendingOrdersCount;
    const itemsSucceeded = syncSuccessCount + expiredCount;
    const itemsFailed = syncErrorCount + orderCheckErrors;

    logger.info(
      'cron.sync-payments-and-expire-orders',
      wideEvent('cron.sync-payments-and-expire-orders', {
        jobName,
        itemsProcessed,
        itemsSucceeded,
        itemsFailed,
        pendingPaymentsCount,
        pendingOrdersCount,
        syncSuccessCount,
        syncErrorCount,
        expiredCount,
        orderCheckErrors,
        ...withDuration(jobStartedAt),
        outcome: itemsFailed > 0 ? 'failure' : 'success',
      }),
    );
  } catch (error) {
    const itemsProcessed = pendingPaymentsCount + pendingOrdersCount;
    const itemsSucceeded = syncSuccessCount + expiredCount;
    const itemsFailed = syncErrorCount + orderCheckErrors + 1;

    logger.error(
      'cron.sync-payments-and-expire-orders',
      wideEvent('cron.sync-payments-and-expire-orders', {
        jobName,
        itemsProcessed,
        itemsSucceeded,
        itemsFailed,
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
 * Starts the cron scheduler for sync payments and expire orders job
 * Only used in development/local environments
 * In production, use runSyncPaymentsAndExpireOrders() via EventBridge
 */
export function startSyncPaymentsAndExpireOrdersJob() {
  const job = cron.schedule('*/5 * * * *', async () => {
    try {
      await runSyncPaymentsAndExpireOrders();
    } catch (error) {
      logger.error(
        'Error in scheduled payment sync and order expiration job:',
        error,
      );
    }
  });

  logger.info(
    'Scheduled job: sync-payments-and-expire-orders started (runs every 5 minutes)',
  );

  return job;
}
