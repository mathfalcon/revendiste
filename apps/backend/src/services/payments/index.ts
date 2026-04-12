import {
  OrdersRepository,
  OrderTicketReservationsRepository,
  PaymentsRepository,
  PaymentEventsRepository,
} from '~/repositories';
import {NotFoundError, ValidationError} from '~/errors';
import {API_BASE_URL, APP_BASE_URL} from '~/config/env';
import {logger} from '~/utils';
import {DLocalService} from '~/services/dlocal';
import type {PaymentProvider} from './providers';
import {
  ORDER_ERROR_MESSAGES,
  PAYMENT_ERROR_MESSAGES,
} from '~/constants/error-messages';
import {PAYMENT_EXTENSION_WINDOW_MINUTES} from '~/constants/reservation';
import {DLOCAL_PAYMENT_DESCRIPTION_MAX_LENGTH} from '~/constants/dlocal';

function buildPaymentLinkDescription(
  eventName: string | null | undefined,
  orderId: string,
) {
  const suffix = ` - (ID: ${orderId})`;
  const maxNameLen = Math.max(
    0,
    DLOCAL_PAYMENT_DESCRIPTION_MAX_LENGTH - suffix.length,
  );
  const base = eventName?.trim() || 'Tickets';
  const truncated =
    base.length > maxNameLen ? base.slice(0, maxNameLen).trimEnd() : base;
  return `${truncated}${suffix}`;
}

interface CreatePaymentLinkParams {
  orderId: string;
  userId: string;
  userEmail: string;
  userFirstName: string | null;
  userLastName: string | null;
  /** Payer country (ISO 3166-1 alpha-2). Defaults to UY if not provided. */
  country?: string;
}

interface CreatePaymentLinkResult {
  redirectUrl: string;
  paymentId: string;
}

export class PaymentsService {
  private paymentProvider: PaymentProvider;

  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly orderTicketReservationsRepository: OrderTicketReservationsRepository,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly paymentEventsRepository: PaymentEventsRepository,
    paymentProvider?: PaymentProvider,
  ) {
    // Default to dLocal for now, but can be injected
    this.paymentProvider = paymentProvider || new DLocalService();
  }

  async createPaymentLink(
    params: CreatePaymentLinkParams,
  ): Promise<CreatePaymentLinkResult> {
    const {
      orderId,
      userId,
      userEmail,
      userFirstName,
      userLastName,
      country: payerCountry,
    } = params;

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

    // Check if order is still pending (we only reuse or create payment for pending orders)
    if (order.status !== 'pending') {
      throw new ValidationError(
        PAYMENT_ERROR_MESSAGES.ORDER_NOT_PENDING(order.status),
      );
    }

    // Reuse existing payment link only when there is already a pending payment for this order
    // (avoids creating duplicate payment records when user refreshes or returns to checkout)
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
    const newReservationExpiresAt = new Date(
      now.getTime() +
        PAYMENT_EXTENSION_WINDOW_MINUTES * 60 * 1000,
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
        windowMinutes: PAYMENT_EXTENSION_WINDOW_MINUTES,
      });
    });

    try {
      const urls = {
        successUrl: `${APP_BASE_URL}/checkout/${order.id}/success`,
        backUrl: `${APP_BASE_URL}/checkout/${order.id}`,
        notificationUrl: `${API_BASE_URL}/api/webhooks/${this.paymentProvider.name}`,
      };

      // Build payer data for dLocal (only if provider supports it).
      // Do NOT send payer.id: dLocal persists a "client" by that id and locks it to a country;
      // once set, that client cannot change country, causing "Client is not from checkout's country"
      // (5000) when the same user pays from a different country. Omitting id avoids client reuse.
      // We still send name and email to prefill checkout. Country from selector (or default UY).
      const payerData =
        this.paymentProvider.name === 'dlocal'
          ? {
              country: payerCountry ?? 'UY',
              payer: {
                name:
                  [userFirstName, userLastName]
                    .filter(Boolean)
                    .join(' ')
                    .trim() || undefined,
                email: userEmail,
              },
            }
          : {};

      // Create payment with provider (external API call, must be OUTSIDE transaction)
      const providerPayment = await this.paymentProvider.createPayment({
        orderId: order.id,
        amount: Number(order.totalAmount),
        currency: order.currency,
        description: buildPaymentLinkDescription(
          order.event?.name,
          order.id,
        ),
        expirationMinutes: PAYMENT_EXTENSION_WINDOW_MINUTES,
        ...urls,
        ...payerData, // Include payer data if provider supports it
      });

      // Validate provider payment response before saving
      if (!providerPayment.id) {
        logger.error('Provider payment missing id', {
          orderId: order.id,
          provider: this.paymentProvider.name,
          providerPayment,
        });
        throw new ValidationError(
          PAYMENT_ERROR_MESSAGES.PAYMENT_CREATION_FAILED(
            'Provider payment response missing id',
          ),
        );
      }

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
