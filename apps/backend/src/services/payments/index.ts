import {
  OrdersRepository,
  OrderTicketReservationsRepository,
  PaymentsRepository,
  PaymentEventsRepository,
} from '~/repositories';
import {NotFoundError, ValidationError} from '~/errors';
import {API_BASE_URL, APP_BASE_URL} from '~/config/env';
import {logger} from '~/utils';
import type {Kysely} from 'kysely';
import type {DB} from '@revendiste/shared';
import {DLocalService} from '~/services/dlocal';
import type {PaymentProvider} from './providers';
import {
  ORDER_ERROR_MESSAGES,
  PAYMENT_ERROR_MESSAGES,
} from '~/constants/error-messages';

interface CreatePaymentLinkParams {
  orderId: string;
  userId: string;
}

interface CreatePaymentLinkResult {
  redirectUrl: string;
  paymentId: string;
}

export class PaymentsService {
  private ordersRepository: OrdersRepository;
  private orderTicketReservationsRepository: OrderTicketReservationsRepository;
  private paymentsRepository: PaymentsRepository;
  private paymentEventsRepository: PaymentEventsRepository;
  private paymentProvider: PaymentProvider;

  constructor(db: Kysely<DB>, paymentProvider?: PaymentProvider) {
    this.ordersRepository = new OrdersRepository(db);
    this.orderTicketReservationsRepository =
      new OrderTicketReservationsRepository(db);
    this.paymentsRepository = new PaymentsRepository(db);
    this.paymentEventsRepository = new PaymentEventsRepository(db);

    // Default to dLocal for now, but can be injected
    this.paymentProvider = paymentProvider || new DLocalService();
  }

  async createPaymentLink(
    params: CreatePaymentLinkParams,
  ): Promise<CreatePaymentLinkResult> {
    const {orderId, userId} = params;

    logger.debug('Creating payment link', {orderId, userId});

    // Get order with details
    const order = await this.ordersRepository.getByIdWithItems(orderId);

    if (!order) {
      throw new NotFoundError(ORDER_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    // Verify user owns the order
    if (order.userId !== userId) {
      throw new NotFoundError(ORDER_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    // Check if order has expired
    const now = new Date();
    if (
      order.reservationExpiresAt &&
      new Date(order.reservationExpiresAt) < now
    ) {
      throw new ValidationError(PAYMENT_ERROR_MESSAGES.ORDER_EXPIRED);
    }

    // Check if order is still pending
    if (order.status !== 'pending') {
      throw new ValidationError(
        PAYMENT_ERROR_MESSAGES.ORDER_NOT_PENDING(order.status),
      );
    }

    // Check if there's already an existing pending payment for this order
    const existingPayment = await this.paymentsRepository.getByOrderId(orderId);
    if (
      existingPayment &&
      existingPayment.redirectUrl &&
      existingPayment.status === 'pending'
    ) {
      logger.debug(
        'Existing pending payment found, redirecting to existing payment link',
        {
          orderId,
          paymentId: existingPayment.id,
          status: existingPayment.status,
        },
      );

      return {
        redirectUrl: existingPayment.redirectUrl,
        paymentId: String(existingPayment.id),
      };
    }

    // Extend reservation time to give user enough time to complete payment
    // Set expiration to 10 minutes from now
    const PAYMENT_WINDOW_MINUTES = 5;
    const newReservationExpiresAt = new Date(
      now.getTime() + PAYMENT_WINDOW_MINUTES * 60 * 1000,
    );

    // Extend order and ticket reservations in a single transaction
    // This ensures atomicity - either both updates succeed or both fail
    await this.ordersRepository.executeTransaction(async trx => {
      const ordersRepo = this.ordersRepository.withTransaction(trx);
      const reservationsRepo =
        this.orderTicketReservationsRepository.withTransaction(trx);

      // Update the order's reservation expiration time
      await ordersRepo.update(orderId, {
        reservationExpiresAt: newReservationExpiresAt,
      });

      // Also extend the ticket reservations to match the new order expiration
      await reservationsRepo.extendReservationsByOrderId(
        orderId,
        newReservationExpiresAt,
      );

      logger.info('Extended reservation time for payment window', {
        orderId,
        newExpiresAt: newReservationExpiresAt,
        windowMinutes: PAYMENT_WINDOW_MINUTES,
      });
    });

    try {
      const urls = {
        successUrl: `${APP_BASE_URL}/checkout/${order.id}/success`,
        backUrl: `${APP_BASE_URL}/checkout/${order.id}`,
        notificationUrl: `${API_BASE_URL}/api/webhooks/${this.paymentProvider.name}`,
      };
      // Create payment with provider (external API call, must be OUTSIDE transaction)
      const providerPayment = await this.paymentProvider.createPayment({
        orderId: order.id,
        amount: Number(order.totalAmount),
        currency: order.currency,
        description: `${order.event?.name || 'Tickets'} - (ID: ${order.id})`,
        expirationMinutes: PAYMENT_WINDOW_MINUTES,
        ...urls,
      });

      // Create payment record and log creation event in a single transaction
      // This ensures atomicity - either both succeed or both fail
      const paymentRecord = await this.paymentsRepository.executeTransaction(
        async trx => {
          // Create transaction-aware repository instances
          const paymentsRepo = this.paymentsRepository.withTransaction(trx);
          const paymentEventsRepo =
            this.paymentEventsRepository.withTransaction(trx);

          // Persist payment record to database
          const payment = await paymentsRepo.create({
            orderId: order.id,
            provider: this.paymentProvider.name,
            providerPaymentId: providerPayment.id,
            status: providerPayment.status,
            amount: String(Number(order.totalAmount)),
            currency: order.currency,
            redirectUrl: providerPayment.redirectUrl,
            providerMetadata: JSON.stringify(providerPayment),
            ...urls,
          });

          // Log payment creation event (immutable audit record)
          await paymentEventsRepo.create({
            paymentId: payment.id,
            eventType: 'payment_created',
            fromStatus: null,
            toStatus: providerPayment.status,
            eventData: JSON.stringify({
              provider: this.paymentProvider.name,
              providerPaymentId: providerPayment.id,
            }),
          });

          logger.info('Payment record created in transaction', {
            paymentId: payment.id,
            provider: this.paymentProvider.name,
            providerPaymentId: providerPayment.id,
            orderId: order.id,
            amount: order.totalAmount,
          });

          return payment;
        },
      );

      return {
        redirectUrl: providerPayment.redirectUrl,
        paymentId: String(paymentRecord.id),
      };
    } catch (error: any) {
      logger.error('Failed to create payment link', {
        orderId,
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw new ValidationError(
        PAYMENT_ERROR_MESSAGES.PAYMENT_CREATION_FAILED(error.message),
      );
    }
  }
}
