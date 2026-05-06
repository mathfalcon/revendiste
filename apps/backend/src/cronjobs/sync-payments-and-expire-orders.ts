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
import {Payment} from '~/types';
import {getJobQueueService} from '~/services/job-queue';

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
): Promise<void> {
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
      logger.debug('Order no longer pending (e.g. already cancelled), skipping expiration', {
        orderId,
      });
      return;
    }

    await ordersRepo.updateStatus(orderId, 'expired', {
      cancelledAt: new Date(),
    });
    await reservationsRepo.releaseByOrderId(orderId);

    didExpire = true;
    logger.info('Order expired successfully', {orderId, reason});
  });

  if (!didExpire) return;

  const orderWithItems = await ordersRepository.getByIdWithItems(orderId);

  if (orderWithItems && orderWithItems.event) {
    notifyOrderExpired(notificationService, {
      buyerUserId: orderWithItems.userId,
      orderId: orderWithItems.id,
      eventName: orderWithItems.event.name || 'el evento',
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
  try {
    logger.info('Starting payment status sync and order expiration...');

    const pendingPayments = await paymentsRepository.getPendingPaymentsForSync({
      minAgeMinutes: 5,
      limit: 500,
    });

    let syncSuccessCount = 0;
    let syncErrorCount = 0;

    if (pendingPayments.length > 0) {
      logger.info('Found pending payments to sync', {
        count: pendingPayments.length,
      });

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
              error: result.reason,
            });
          }
        }

        logger.debug('Processed payment batch', {
          batchNumber: Math.floor(i / BATCH_SIZE) + 1,
          batchSize: batch.length,
          totalBatches: Math.ceil(pendingPayments.length / BATCH_SIZE),
        });
      }

      logger.info('Payment status sync completed', {
        total: pendingPayments.length,
        successful: syncSuccessCount,
        errors: syncErrorCount,
      });
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

    if (pendingOrders.length === 0) {
      logger.debug('No pending orders to check for expiration');
      return;
    }

    logger.debug('Checking pending orders for expiration', {
      count: pendingOrders.length,
    });

    let expiredCount = 0;
    let expiredNoPaymentCount = 0;
    const expiredOrderIds: string[] = [];

    for (const order of pendingOrders) {
      try {
        const payments = await paymentsRepository.getAllByOrderId(order.id);

        // Handle orders without any payment link
        if (payments.length === 0) {
          // Check if reservation has expired
          const reservationExpired =
            order.reservationExpiresAt &&
            new Date(order.reservationExpiresAt) < now;

          if (reservationExpired) {
            logger.info(
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
              expiredOrderIds.push(order.id);
              expiredNoPaymentCount++;
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

        // Handle orders with payments - check if all payments failed
        const terminalFailureStates = ['expired', 'failed', 'cancelled'];
        const allPaymentsTerminal = payments.every(p =>
          terminalFailureStates.includes(p.status),
        );
        const hasPaidPayment = payments.some(p => p.status === 'paid');

        if (allPaymentsTerminal && !hasPaidPayment) {
          logger.info('Expiring order based on payment provider status', {
            orderId: order.id,
            paymentStatuses: payments.map(p => ({
              id: p.id,
              status: p.status,
              provider: p.provider,
            })),
          });

          await expireOrder(order.id, 'all_payments_failed');
          expiredOrderIds.push(order.id);
          expiredCount++;
        }
      } catch (error: any) {
        logger.error('Error checking order for expiration', {
          orderId: order.id,
          error: error.message,
        });
      }
    }

    if (expiredCount > 0) {
      logger.info('Order expiration completed', {
        expiredCount,
        expiredNoPaymentCount,
        expiredFailedPaymentCount: expiredCount - expiredNoPaymentCount,
        orderIds: expiredOrderIds,
      });
    } else {
      logger.debug('No orders expired');
    }
  } catch (error) {
    logger.error('Error in payment sync and order expiration job:', error);
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
