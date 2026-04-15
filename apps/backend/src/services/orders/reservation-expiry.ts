import type {
  OrdersRepository,
  OrderTicketReservationsRepository,
  PaymentsRepository,
} from '~/repositories';
import type {NotificationService} from '~/services/notifications';
import {notifyOrderExpired} from '~/services/notifications/helpers';
import {logger} from '~/utils';

export type OrderReservationExpiryDeps = {
  ordersRepository: OrdersRepository;
  orderTicketReservationsRepository: OrderTicketReservationsRepository;
  paymentsRepository: PaymentsRepository;
  notificationService: NotificationService;
};

/**
 * Expires a pending order that has no payment rows and releases reservations.
 * Uses row locking; safe to call from cron or on read (getOrderById).
 */
export async function expireOrderWithoutPaymentLink(
  orderId: string,
  deps: OrderReservationExpiryDeps,
): Promise<boolean> {
  const {
    ordersRepository,
    orderTicketReservationsRepository,
    paymentsRepository,
    notificationService,
  } = deps;

  let expired = false;

  await ordersRepository.executeTransaction(async trx => {
    const ordersRepo = ordersRepository.withTransaction(trx);
    const reservationsRepo =
      orderTicketReservationsRepository.withTransaction(trx);
    const paymentsRepo = paymentsRepository.withTransaction(trx);

    const order = await trx
      .selectFrom('orders')
      .select(['id', 'status'])
      .where('id', '=', orderId)
      .where('status', '=', 'pending')
      .where('deletedAt', 'is', null)
      .forUpdate()
      .executeTakeFirst();

    if (!order) {
      logger.debug('Order no longer pending, skipping expiration', {orderId});
      return;
    }

    const payments = await paymentsRepo.getAllByOrderId(orderId);
    if (payments.length > 0) {
      logger.debug('Payment found during transaction, skipping expiration', {
        orderId,
        paymentCount: payments.length,
      });
      return;
    }

    await ordersRepo.updateStatus(orderId, 'expired', {
      cancelledAt: new Date(),
    });
    await reservationsRepo.releaseByOrderId(orderId);

    expired = true;
    logger.info('Order expired (no payment link created)', {orderId});
  });

  if (expired) {
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

  return expired;
}
