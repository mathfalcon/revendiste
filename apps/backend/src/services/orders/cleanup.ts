import type {Kysely} from 'kysely';
import type {DB} from '@revendiste/shared';
import {
  OrdersRepository,
  OrderTicketReservationsRepository,
  UsersRepository,
} from '~/repositories';
import {logger} from '~/utils';
import {NotificationService} from '~/services/notifications';
import {notifyOrderExpired} from '~/services/notifications/helpers';

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
  private notificationService: NotificationService;

  constructor(private db: Kysely<DB>) {
    this.ordersRepository = new OrdersRepository(db);
    this.orderTicketReservationsRepository =
      new OrderTicketReservationsRepository(db);
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
   */
  private async expireOrder(orderId: string): Promise<void> {
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
