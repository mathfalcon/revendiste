import cron from 'node-cron';
import {db} from '~/db';
import {
  PaymentsRepository,
  OrdersRepository,
  OrderTicketReservationsRepository,
  UsersRepository,
} from '~/repositories';
import {PaymentWebhookAdapter} from '~/services/payments/adapters';
import {getPaymentProvider} from '~/services/payments/providers/PaymentProviderFactory';
import {NotificationService} from '~/services/notifications';
import {notifyOrderExpired} from '~/services/notifications/helpers';
import {logger} from '~/utils';
import {Payment} from '~/types';

/**
 * Processes a single payment status sync
 */
async function processPaymentSync(
  payment: Pick<Payment, 'id' | 'provider' | 'providerPaymentId'>,
): Promise<{success: boolean; paymentId: string}> {
  try {
    const provider = getPaymentProvider(payment.provider);
    const adapter = new PaymentWebhookAdapter(provider, db);
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
 * Expires a single order and releases its reservations
 * Only called when we've confirmed all payments are in terminal failure states
 */
async function expireOrder(orderId: string): Promise<void> {
  const ordersRepository = new OrdersRepository(db);
  const orderTicketReservationsRepository =
    new OrderTicketReservationsRepository(db);
  const notificationService = new NotificationService(
    db,
    new UsersRepository(db),
  );

  await ordersRepository.executeTransaction(async trx => {
    const ordersRepo = ordersRepository.withTransaction(trx);
    const reservationsRepo =
      orderTicketReservationsRepository.withTransaction(trx);

    await ordersRepo.updateStatus(orderId, 'expired', {
      cancelledAt: new Date(),
    });
    await reservationsRepo.releaseByOrderId(orderId);

    logger.info('Order expired successfully', {orderId});
  });

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
  const paymentsRepository = new PaymentsRepository(db);

    try {
      logger.info('Starting payment status sync and order expiration...');

      const pendingPayments =
        await paymentsRepository.getPendingPaymentsForSync({
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

      const pendingOrders = await db
        .selectFrom('orders')
        .select(['id'])
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
      const expiredOrderIds: string[] = [];

      for (const order of pendingOrders) {
        try {
          const payments = await paymentsRepository.getAllByOrderId(order.id);
          if (payments.length === 0) continue;

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

            await expireOrder(order.id);
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
          orderIds: expiredOrderIds,
        });
      } else {
        logger.debug('No orders expired based on payment status');
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
      logger.error('Error in scheduled payment sync and order expiration job:', error);
    }
  });

  logger.info(
    'Scheduled job: sync-payments-and-expire-orders started (runs every 5 minutes)',
  );

  return job;
}
