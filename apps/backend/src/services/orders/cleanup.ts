import type {PaymentProvider as PaymentProviderEnum} from '@revendiste/shared';
import {
  OrdersRepository,
  OrderTicketReservationsRepository,
  PaymentsRepository,
} from '~/repositories';
import {logger} from '~/utils';
import {redactKnownSecrets, wideEvent, withDuration} from '~/utils/logFields';
import {NotificationService} from '~/services/notifications';
import {notifyOrderExpired} from '~/services/notifications/helpers';

/**
 * Function signature for syncing payment status with a provider.
 * This is injected to keep the service decoupled from the adapter/db.
 */
export type SyncPaymentFunction = (
  providerPaymentId: string,
  provider: PaymentProviderEnum,
) => Promise<void>;

/**
 * Order Cleanup Service
 *
 * Handles expiration of orders and cleanup of associated reservations.
 * Follows the same transactional pattern as payment webhooks to ensure
 * order state and ticket reservations stay in sync.
 *
 * @remarks Not wired to any cron or routes in this codebase (dead code path).
 * Production expiration uses `runSyncPaymentsAndExpireOrders` + `expireOrderWithoutPaymentLink`.
 * Kept for reference; safe to remove in a dedicated cleanup PR.
 */
export class OrderCleanupService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly orderTicketReservationsRepository: OrderTicketReservationsRepository,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly notificationService: NotificationService,
    private readonly syncPaymentWithProvider: SyncPaymentFunction,
  ) {}

  /**
   * Processes expired orders
   * - Finds orders that have passed their reservation expiration time
   * - Updates order status to 'expired'
   * - Releases associated ticket reservations
   *
   * This is called by the scheduled cleanup job
   */
  async processExpiredOrders(): Promise<{
    processedCount: number;
    orderIds: string[];
  }> {
    const batchStartedAt = Date.now();
    try {
      // Get all expired orders
      const expiredOrders = await this.ordersRepository.getExpiredOrders();

      if (expiredOrders.length === 0) {
        logger.debug('No expired orders found');
        return {processedCount: 0, orderIds: []};
      }

      const processedOrderIds: string[] = [];

      // Process each expired order
      for (const order of expiredOrders) {
        try {
          await this.expireOrder(order.id);
          processedOrderIds.push(order.id);
        } catch (error: unknown) {
          logger.error(
            'orders.expired',
            wideEvent('orders.expired', {
              orderId: order.id,
              reason: 'all_payments_terminal' as const,
              paymentIds: [] as string[],
              error: redactKnownSecrets(
                error instanceof Error
                  ? {message: error.message, stack: error.stack}
                  : {message: String(error)},
              ),
              ...withDuration(batchStartedAt),
              outcome: 'failure',
            }),
          );
          // Continue processing other orders even if one fails
        }
      }

      logger.info('orderCleanup.processExpiredOrders.batch', {
        totalFound: expiredOrders.length,
        successfullyProcessed: processedOrderIds.length,
        failedCount: expiredOrders.length - processedOrderIds.length,
        ...withDuration(batchStartedAt),
      });

      return {
        processedCount: processedOrderIds.length,
        orderIds: processedOrderIds,
      };
    } catch (error: unknown) {
      logger.error('orderCleanup.processExpiredOrders.failed', {
        error: redactKnownSecrets(
          error instanceof Error
            ? {message: error.message, stack: error.stack}
            : {message: String(error)},
        ),
        ...withDuration(batchStartedAt),
      });
      throw error;
    }
  }

  /**
   * Expires a single order and releases its reservations
   * Uses a transaction to ensure atomicity
   *
   * Before expiring, checks payment status with provider to ensure
   * we don't expire orders that have actually been paid (e.g., if webhook was missed)
   */
  private async expireOrder(orderId: string): Promise<void> {
    const expireStartedAt = Date.now();
    const payments = await this.paymentsRepository.getAllByOrderId(orderId);
    const pendingPayments = payments.filter(
      p => p.status === 'pending' || p.status === 'processing',
    );

    // If there are pending payments, sync their status with the provider first
    if (pendingPayments.length > 0) {
      logger.debug('Found pending payments for expired order, syncing status', {
        orderId,
        paymentCount: pendingPayments.length,
      });

      // Sync each pending payment
      for (const payment of pendingPayments) {
        try {
          await this.syncPaymentWithProvider(
            payment.providerPaymentId,
            payment.provider,
          );

          logger.debug('Payment status synced before order expiration', {
            orderId,
            paymentId: payment.id,
            provider: payment.provider,
            providerPaymentId: payment.providerPaymentId,
          });
        } catch (error) {
          logger.error(
            'Failed to sync payment status before order expiration',
            {
              orderId,
              paymentId: payment.id,
              provider: payment.provider,
              providerPaymentId: payment.providerPaymentId,
              error: error instanceof Error ? error.message : String(error),
            },
          );
          // Continue with other payments even if one fails
        }
      }

      const orderAfterSync =
        await this.ordersRepository.getByIdWithItems(orderId);
      if (!orderAfterSync) {
        logger.warn('Order not found after payment sync', {orderId});
        return;
      }

      if (orderAfterSync.status !== 'pending') {
        logger.debug(
          'Order status changed after payment sync, skipping expiration',
          {
            orderId,
            newStatus: orderAfterSync.status,
          },
        );
        return;
      }

      const paymentsAfterSync =
        await this.paymentsRepository.getAllByOrderId(orderId);
      const paidPayments = paymentsAfterSync.filter(p => p.status === 'paid');

      if (paidPayments.length > 0) {
        logger.warn(
          'Order has paid payments but status is still pending, skipping expiration',
          {
            orderId,
            paidPaymentIds: paidPayments.map(p => p.id),
          },
        );
        return;
      }
    }

    // Proceed with expiration only if no payments succeeded
    await this.ordersRepository.executeTransaction(async trx => {
      const ordersRepo = this.ordersRepository.withTransaction(trx);
      const reservationsRepo =
        this.orderTicketReservationsRepository.withTransaction(trx);

      // Update order status to 'expired'
      await ordersRepo.updateStatus(orderId, 'expired', {
        cancelledAt: new Date(),
      });

      // Release ticket reservations
      await reservationsRepo.releaseByOrderId(orderId);
    });

    const paymentIdsAfter = (
      await this.paymentsRepository.getAllByOrderId(orderId)
    ).map(p => p.id);

    logger.info(
      'orders.expired',
      wideEvent('orders.expired', {
        orderId,
        reason: 'all_payments_terminal' as const,
        paymentIds: paymentIdsAfter,
        ...withDuration(expireStartedAt),
        outcome: 'success',
      }),
    );

    // Send notification to buyer (outside transaction - fire-and-forget)
    // Get order data with event name for notification
    const orderWithItems =
      await this.ordersRepository.getByIdWithItems(orderId);

    if (orderWithItems && orderWithItems.event) {
      // Fire-and-forget notification (don't await to avoid blocking)
      notifyOrderExpired(this.notificationService, {
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
}
