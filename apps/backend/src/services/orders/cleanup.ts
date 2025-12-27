import type {Kysely} from 'kysely';
import type {DB} from '@revendiste/shared';
import {
  OrdersRepository,
  OrderTicketReservationsRepository,
  PaymentsRepository,
  UsersRepository,
} from '~/repositories';
import {logger} from '~/utils';
import {NotificationService} from '~/services/notifications';
import {notifyOrderExpired} from '~/services/notifications/helpers';
import {PaymentWebhookAdapter} from '~/services/payments/adapters';
import {getPaymentProvider} from '~/services/payments/providers/PaymentProviderFactory';

/**
 * Order Cleanup Service
 *
 * Handles expiration of orders and cleanup of associated reservations.
 * Follows the same transactional pattern as payment webhooks to ensure
 * order state and ticket reservations stay in sync.
 */
export class OrderCleanupService {
  private ordersRepository: OrdersRepository;
  private orderTicketReservationsRepository: OrderTicketReservationsRepository;
  private paymentsRepository: PaymentsRepository;
  private notificationService: NotificationService;

  constructor(private db: Kysely<DB>) {
    this.ordersRepository = new OrdersRepository(db);
    this.orderTicketReservationsRepository =
      new OrderTicketReservationsRepository(db);
    this.paymentsRepository = new PaymentsRepository(db);
    this.notificationService = new NotificationService(
      db,
      new UsersRepository(db),
    );
  }

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
    try {
      logger.info('Processing expired orders...');

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
        } catch (error: any) {
          logger.error('Error expiring individual order', {
            orderId: order.id,
            error: error.message,
            stack: error.stack,
          });
          // Continue processing other orders even if one fails
        }
      }

      logger.info('Expired orders processed successfully', {
        totalFound: expiredOrders.length,
        successfullyProcessed: processedOrderIds.length,
        failedCount: expiredOrders.length - processedOrderIds.length,
      });

      return {
        processedCount: processedOrderIds.length,
        orderIds: processedOrderIds,
      };
    } catch (error: any) {
      logger.error('Error in processExpiredOrders', {
        error: error.message,
        stack: error.stack,
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
    const payments = await this.paymentsRepository.getAllByOrderId(orderId);
    const pendingPayments = payments.filter(
      p => p.status === 'pending' || p.status === 'processing',
    );

    // If there are pending payments, sync their status with the provider first
    if (pendingPayments.length > 0) {
      logger.info('Found pending payments for expired order, syncing status', {
        orderId,
        paymentCount: pendingPayments.length,
      });

      // Sync each pending payment
      for (const payment of pendingPayments) {
        try {
          // Get provider instance
          const provider = getPaymentProvider(payment.provider);

          // Create adapter with provider
          const adapter = new PaymentWebhookAdapter(provider, this.db);

          await adapter.processWebhook(payment.providerPaymentId);

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

      const orderAfterSync = await this.ordersRepository.getByIdWithItems(
        orderId,
      );
      if (!orderAfterSync) {
        logger.warn('Order not found after payment sync', {orderId});
        return;
      }

      if (orderAfterSync.status !== 'pending') {
        logger.info(
          'Order status changed after payment sync, skipping expiration',
          {
            orderId,
            newStatus: orderAfterSync.status,
          },
        );
        return;
      }

      const paymentsAfterSync = await this.paymentsRepository.getAllByOrderId(
        orderId,
      );
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

      logger.info('Order expired successfully', {
        orderId,
        timestamp: new Date().toISOString(),
      });
    });

    // Send notification to buyer (outside transaction - fire-and-forget)
    // Get order data with event name for notification
    const orderWithItems = await this.ordersRepository.getByIdWithItems(
      orderId,
    );

    if (orderWithItems && orderWithItems.event) {
      // Fire-and-forget notification (don't await to avoid blocking)
      notifyOrderExpired(this.notificationService, {
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
}
