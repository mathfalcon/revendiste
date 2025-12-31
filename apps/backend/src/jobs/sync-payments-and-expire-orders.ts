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
    // Get provider instance
    const provider = getPaymentProvider(payment.provider);

    // Create adapter with provider
    const adapter = new PaymentWebhookAdapter(provider, db);

    // Sync payment status by polling the provider
    // Logs 'status_synced' event to distinguish from actual webhooks in audit logs
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

  // Proceed with expiration
  await ordersRepository.executeTransaction(async trx => {
    const ordersRepo = ordersRepository.withTransaction(trx);
    const reservationsRepo =
      orderTicketReservationsRepository.withTransaction(trx);

    // Update order status to 'expired'
    await ordersRepo.updateStatus(orderId, 'expired', {
      cancelledAt: new Date(),
    });

    // Release ticket reservations
    await reservationsRepo.releaseByOrderId(orderId);

    logger.info('Order expired successfully', {
      orderId,
      timestamp: new Date().toISOString(),
    });
  });

  // Send notification to buyer (outside transaction - fire-and-forget)
  // Get order data with event name for notification
  const orderWithItems = await ordersRepository.getByIdWithItems(orderId);

  if (orderWithItems && orderWithItems.event) {
    // Fire-and-forget notification (don't await to avoid blocking)
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
 * Scheduled job to sync payment statuses with providers and expire orders
 * Runs every 5 minutes to check pending payments and sync their status
 *
 * This job:
 * - Finds pending/processing payments older than 5 minutes
 * - For each payment, queries the provider for current status (active polling)
 * - Uses PaymentWebhookAdapter to process status updates (same logic as webhooks)
 * - After syncing, expires orders based on payment provider status (not database timestamps)
 * - Only expires orders when ALL payments are in terminal failure states and NONE are paid
 * - Processes payments in parallel batches (25 concurrent) for better throughput
 * - Handles errors gracefully (one failure doesn't stop others)
 *
 * This job serves as the primary reliability mechanism when webhooks fail or are delayed,
 * especially important in dev environments where webhooks may not be called.
 */
export function startSyncPaymentsAndExpireOrdersJob() {
  const paymentsRepository = new PaymentsRepository(db);
  const ordersRepository = new OrdersRepository(db);

  // Run every 5 minutes: '*/5 * * * *'
  // This ensures we catch payments that didn't receive webhooks
  const job = cron.schedule('*/5 * * * *', async () => {
    try {
      logger.info('Starting payment status sync and order expiration...');

      // PHASE 1: Sync payment statuses from providers
      // Get pending payments that need status sync
      // Only check payments older than 5 minutes to avoid checking too early
      const pendingPayments =
        await paymentsRepository.getPendingPaymentsForSync({
          minAgeMinutes: 5,
          limit: 500, // Process up to 500 payments per run (increased since we process in parallel)
        });

      let syncSuccessCount = 0;
      let syncErrorCount = 0;

      if (pendingPayments.length > 0) {
        logger.info('Found pending payments to sync', {
          count: pendingPayments.length,
        });

        // Process payments in parallel batches
        const BATCH_SIZE = 25; // Process 25 payments concurrently per batch

        for (let i = 0; i < pendingPayments.length; i += BATCH_SIZE) {
          const batch = pendingPayments.slice(i, i + BATCH_SIZE);

          // Process batch in parallel using Promise.allSettled
          // This ensures one failure doesn't stop others
          const results = await Promise.allSettled(
            batch.map(payment => processPaymentSync(payment)),
          );

          // Count successes and errors
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

      // PHASE 2: Expire orders based on payment provider status
      // Find orders that should be expired based on payment status (not database timestamps)
      // Only expire orders where:
      // - Order status is 'pending'
      // - All payments for the order are in terminal failure states (expired, failed, cancelled)
      // - No payments are 'paid'

      // Get all pending orders
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

      // Check each pending order
      for (const order of pendingOrders) {
        try {
          // Get all payments for this order
          const payments = await paymentsRepository.getAllByOrderId(order.id);

          // Skip orders with no payments
          if (payments.length === 0) {
            continue;
          }

          // Check if all payments are in terminal failure states
          const terminalFailureStates = ['expired', 'failed', 'cancelled'];
          const allPaymentsTerminal = payments.every(p =>
            terminalFailureStates.includes(p.status),
          );

          // Check if any payment is paid
          const hasPaidPayment = payments.some(p => p.status === 'paid');

          // Only expire if:
          // 1. All payments are in terminal failure states
          // 2. No payments are paid
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
            stack: error.stack,
          });
          // Continue processing other orders even if one fails
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
    }
  });

  logger.info(
    'Scheduled job: sync-payments-and-expire-orders started (runs every 5 minutes)',
  );

  return job;
}
