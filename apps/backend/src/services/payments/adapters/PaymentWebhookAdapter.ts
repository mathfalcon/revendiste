import {compareAmounts} from '@revendiste/shared';
import {
  OrdersRepository,
  OrderTicketReservationsRepository,
  PaymentsRepository,
  PaymentEventsRepository,
  ListingTicketsRepository,
  TicketListingsRepository,
} from '~/repositories';
import {NotFoundError, ValidationError} from '~/errors';
import {logger} from '~/utils';
import type {
  PaymentProvider,
  ProviderPaymentData,
} from '../providers/PaymentProvider.interface';
import {
  ORDER_ERROR_MESSAGES,
  PAYMENT_ERROR_MESSAGES,
} from '~/constants/error-messages';
import type {PaymentStatus, PaymentMethod} from '@revendiste/shared';
import {TicketListingsService} from '~/services/ticket-listings';
import {SellerEarningsService} from '~/services/seller-earnings';
import {NotificationService} from '~/services/notifications';
import {
  notifyOrderConfirmed,
  notifyOrderExpired,
  notifyPaymentFailed,
  notifySellerTicketSold,
} from '~/services/notifications/helpers';
import type { JobQueueService } from '~/services/job-queue';
import type { SellerNotificationData } from '~/services/ticket-listings';

/**
 * Normalized payment data in our system's format
 */
export interface NormalizedPaymentData {
  providerPaymentId: string;
  status: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  balanceAmount?: number;
  balanceFee?: number;
  balanceCurrency?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  payer?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    documentType?: string;
    document?: string;
    country?: string;
  };
  metadata: Record<string, unknown>;
}

export interface WebhookMetadata {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Result from processing a payment update
 */
interface PaymentUpdateResult {
  paymentId: string;
  status: string;
  metadata: Record<string, unknown>;
}

/**
 * Payment Webhook Adapter
 *
 * Adapts payment provider webhooks to our internal system.
 * Follows the Adapter pattern to decouple payment providers from business logic.
 *
 * Responsibilities:
 * - Normalize provider data to our format
 * - Handle all business logic (database operations, order management)
 * - Provide consistent webhook processing across all providers
 *
 * Idempotency: Duplicate "paid" webhooks are safe. handleSuccessfulPayment returns
 * early when the order is already confirmed, so provider retries do not re-run the
 * confirm flow.
 */
export class PaymentWebhookAdapter {
  constructor(
    private readonly provider: PaymentProvider,
    private readonly ordersRepository: OrdersRepository,
    private readonly orderTicketReservationsRepository: OrderTicketReservationsRepository,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly paymentEventsRepository: PaymentEventsRepository,
    private readonly listingTicketsRepository: ListingTicketsRepository,
    private readonly ticketListingsRepository: TicketListingsRepository,
    private readonly ticketListingsService: TicketListingsService,
    private readonly sellerEarningsService: SellerEarningsService,
    private readonly notificationService: NotificationService,
    private readonly jobQueueService: JobQueueService | (() => JobQueueService),
  ) {}

  private getJobQueue(): JobQueueService {
    return typeof this.jobQueueService === 'function'
      ? this.jobQueueService()
      : this.jobQueueService;
  }

  /**
   * Process a webhook callback from the payment provider
   * Logs a 'webhook_received' event for audit trail
   *
   * @param paymentId - The provider's payment ID
   * @param webhookMetadata - IP address and user agent from the webhook request
   */
  async processWebhook(
    paymentId: string,
    webhookMetadata?: WebhookMetadata,
  ): Promise<void> {
    try {
      logger.info('Processing webhook', {
        provider: this.provider.name,
        paymentId,
      });

      const result = await this.fetchAndProcessPayment(paymentId);

      await this.paymentEventsRepository.logWebhookReceived(
        result.paymentId,
        result.metadata,
        webhookMetadata,
      );

      logger.info('Webhook processed successfully', {
        provider: this.provider.name,
        paymentId: result.paymentId,
        status: result.status,
      });
    } catch (error: any) {
      logger.error('Error processing webhook', {
        provider: this.provider.name,
        paymentId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Manually sync payment status by polling the provider
   * Logs a 'status_synced' event for audit trail
   * Used by background jobs when webhooks may not be reliable
   *
   * @param paymentId - The provider's payment ID
   */
  async syncPaymentStatus(paymentId: string): Promise<void> {
    try {
      logger.info('Syncing payment status', {
        provider: this.provider.name,
        paymentId,
      });

      const result = await this.fetchAndProcessPayment(paymentId);

      await this.paymentEventsRepository.logStatusSynced(
        result.paymentId,
        result.metadata,
      );

      logger.info('Payment status synced successfully', {
        provider: this.provider.name,
        paymentId: result.paymentId,
        status: result.status,
      });
    } catch (error: any) {
      logger.error('Error syncing payment status', {
        provider: this.provider.name,
        paymentId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  private async fetchAndProcessPayment(
    paymentId: string,
  ): Promise<PaymentUpdateResult> {
    const providerPayment = await this.provider.getPayment(paymentId);
    const normalized = this.normalizePaymentData(providerPayment);
    const internalPaymentId = await this.processNormalizedPayment(normalized);

    return {
      paymentId: internalPaymentId,
      status: normalized.status,
      metadata: normalized.metadata,
    };
  }

  /**
   * Normalizes provider-specific payment data to our standard format
   */
  private normalizePaymentData(
    providerPayment: ProviderPaymentData,
  ): NormalizedPaymentData {
    const normalizers: Record<string, (payment: any) => NormalizedPaymentData> =
      {
        dlocal: this.normalizeDLocalPayment.bind(this),
        // Future providers:
        // stripe: this.normalizeStripePayment.bind(this),
        // paypal: this.normalizePayPalPayment.bind(this),
      };

    const normalizer = normalizers[this.provider.name];
    if (!normalizer) {
      throw new Error(
        `No normalizer found for provider: ${this.provider.name}`,
      );
    }

    return normalizer(providerPayment);
  }

  /**
   * Normalizes dLocal payment data
   */
  private normalizeDLocalPayment(payment: any): NormalizedPaymentData {
    return {
      providerPaymentId: payment.id,
      status: this.provider.normalizeStatus(payment.status),
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.payment_type,
      balanceAmount: payment.balance_amount,
      balanceFee: payment.balance_fee,
      balanceCurrency: payment.balance_currency,
      approvedAt: payment.approved_date
        ? new Date(payment.approved_date)
        : undefined,
      rejectedReason: payment.rejected_reason,
      payer: payment.payer
        ? {
            email: payment.payer.email,
            firstName: payment.payer.first_name,
            lastName: payment.payer.last_name,
            documentType: payment.payer.document_type,
            document: payment.payer.document,
            country: payment.country,
          }
        : undefined,
      metadata: {
        fullResponse: payment,
      },
    };
  }

  /**
   * Processes normalized payment data through our business logic
   * Returns the internal payment ID for event logging by the caller
   */
  private async processNormalizedPayment(
    paymentData: NormalizedPaymentData,
  ): Promise<string> {
    const {providerPaymentId} = paymentData;

    // Find payment record in database
    let paymentRecord = await this.paymentsRepository.getByProviderPaymentId(
      this.provider.name,
      providerPaymentId,
    );

    if (!paymentRecord) {
      logger.error('Payment record not found', {
        provider: this.provider.name,
        paymentId: providerPaymentId,
      });
      throw new NotFoundError(PAYMENT_ERROR_MESSAGES.PAYMENT_NOT_FOUND);
    }

    // Get associated order
    const order = await this.ordersRepository.getByIdWithItems(
      paymentRecord.orderId,
    );

    if (!order) {
      logger.error('Order not found for payment', {
        paymentId: providerPaymentId,
        orderId: paymentRecord.orderId,
      });
      throw new NotFoundError(ORDER_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    // Validate payment amount matches order
    // Use shared utility to compare amounts with consistent rounding
    if (!compareAmounts(paymentData.amount, order.totalAmount)) {
      logger.error('Payment amount mismatch', {
        paymentId: providerPaymentId,
        orderId: order.id,
        paymentAmount: paymentData.amount,
        orderAmount: order.totalAmount,
      });
      throw new ValidationError(PAYMENT_ERROR_MESSAGES.PAYMENT_AMOUNT_MISMATCH);
    }

    // Update payment record
    const oldStatus = paymentRecord.status;
    const newStatus = paymentData.status;

    // Calculate exchange rate when currencies differ and we have settlement data
    // Formula: (balance_amount + balance_fee) / amount
    // Example: (2019.94 UYU + 50.26 UYU) / 53.66 USD = 38.58 UYU/USD
    let exchangeRate: string | undefined;
    if (
      paymentData.balanceAmount &&
      paymentData.balanceFee !== undefined &&
      paymentData.balanceCurrency &&
      paymentData.currency !== paymentData.balanceCurrency
    ) {
      const totalSettlement = paymentData.balanceAmount + paymentData.balanceFee;
      const calculatedRate = totalSettlement / paymentData.amount;
      exchangeRate = String(calculatedRate);

      logger.info('Calculated exchange rate for payment', {
        paymentId: paymentData.providerPaymentId,
        originalAmount: paymentData.amount,
        originalCurrency: paymentData.currency,
        settlementAmount: paymentData.balanceAmount,
        settlementFee: paymentData.balanceFee,
        settlementCurrency: paymentData.balanceCurrency,
        exchangeRate: calculatedRate,
      });
    }

    paymentRecord = await this.paymentsRepository.update(
      String(paymentRecord.id),
      {
        status: newStatus as PaymentStatus,
        balanceAmount: paymentData.balanceAmount
          ? String(paymentData.balanceAmount)
          : undefined,
        balanceFee: paymentData.balanceFee
          ? String(paymentData.balanceFee)
          : undefined,
        balanceCurrency: paymentData.balanceCurrency,
        // Store exchange rate if currencies differ (dLocal settles in UYU even for USD orders)
        exchangeRate,
        paymentMethod: (paymentData.paymentMethod as PaymentMethod) ?? undefined,
        payerEmail: paymentData.payer?.email,
        payerFirstName: paymentData.payer?.firstName,
        payerLastName: paymentData.payer?.lastName,
        payerDocumentType: paymentData.payer?.documentType,
        payerDocument: paymentData.payer?.document,
        payerCountry: paymentData.payer?.country,
        failureReason: paymentData.rejectedReason,
        approvedAt: paymentData.approvedAt,
        failedAt: newStatus === 'failed' ? new Date() : undefined,
        cancelledAt: newStatus === 'cancelled' ? new Date() : undefined,
        expiredAt: newStatus === 'expired' ? new Date() : undefined,
        providerMetadata: JSON.stringify(paymentData.metadata),
      },
    );

    // Log status change event if status changed
    if (String(oldStatus) !== String(newStatus)) {
      await this.paymentEventsRepository.logStatusChange(
        String(paymentRecord.id),
        oldStatus as PaymentStatus | null,
        newStatus as PaymentStatus,
        paymentData.metadata,
      );
    }

    // Handle order status based on payment status
    await this.handleOrderStatusUpdate(order.id, newStatus, paymentData);

    return String(paymentRecord.id);
  }

  /**
   * Handles order status update based on payment status
   *
   * Note: Payment record is ALWAYS updated (in processNormalizedPayment).
   * This method only updates the ORDER when the payment reaches a terminal state.
   */
  private async handleOrderStatusUpdate(
    orderId: string,
    status: string,
    paymentData: NormalizedPaymentData,
  ): Promise<void> {
    switch (status) {
      case 'paid':
        await this.handleSuccessfulPayment(orderId, paymentData);
        break;

      case 'failed':
      case 'cancelled':
        await this.handleFailedPayment(orderId, status, paymentData);
        break;

      case 'expired':
        await this.handleExpiredPayment(orderId, paymentData);
        break;

      case 'pending':
      case 'processing':
        // Payment is still in progress - order remains 'pending'
        // No order status change needed (order is already 'pending' when created)
        // Payment record has already been updated with latest status
        logger.info('Payment still in progress, order remains pending', {
          orderId,
          paymentStatus: status,
          paymentId: paymentData.providerPaymentId,
        });
        break;

      default:
        logger.warn('Unknown payment status received', {
          orderId,
          paymentStatus: status,
          paymentId: paymentData.providerPaymentId,
        });
    }
  }

  /**
   * Handles successful payment - confirms order, marks tickets sold, creates earnings, then confirms reservations.
   * Idempotent: returns early if order is already confirmed (e.g. duplicate webhook).
   */
  private async handleSuccessfulPayment(
    orderId: string,
    paymentData: NormalizedPaymentData,
  ): Promise<void> {
    // Idempotency: skip if order already confirmed (duplicate webhook or retry)
    const existingOrder =
      await this.ordersRepository.getByIdWithItems(orderId);
    if (existingOrder?.status === 'confirmed') {
      logger.info('Order already confirmed, skipping successful payment flow', {
        orderId,
        paymentId: paymentData.providerPaymentId,
      });
      return;
    }

    let sellerNotifications: SellerNotificationData[] = [];
    let soldTickets: Array<{listingId: string}> = [];

    await this.ordersRepository.executeTransaction(async trx => {
      const ordersRepo = this.ordersRepository.withTransaction(trx);
      const reservationsRepo =
        this.orderTicketReservationsRepository.withTransaction(trx);
      const ticketListingsRepo =
        this.ticketListingsRepository.withTransaction(trx);

      await ordersRepo.updateStatus(orderId, 'confirmed', {
        confirmedAt: new Date(),
      });

      const result =
        await this.ticketListingsService.markTicketsAsSoldAndReturnSellerData(
          orderId,
          trx,
        );
      soldTickets = result.soldTickets;
      sellerNotifications = result.sellerNotifications;

      await this.sellerEarningsService.createEarningsForSoldTickets(
        orderId,
        trx,
      );

      await reservationsRepo.confirmOrderReservations(orderId);

      const uniqueListingIds = [
        ...new Set(soldTickets.map(ticket => ticket.listingId)),
      ];
      const soldListings =
        await ticketListingsRepo.checkAndMarkListingsAsSold(
          uniqueListingIds,
        );

      logger.info('Order confirmed successfully', {
        orderId,
        paymentId: paymentData.providerPaymentId,
        paymentMethod: paymentData.paymentMethod,
        provider: this.provider.name,
        ticketsSold: soldTickets.length,
        listingsSoldOut: soldListings.length,
      });
    });

    const orderWithItems = await this.ordersRepository.getByIdWithItems(
      orderId,
    );
    if (!orderWithItems?.event) return;

    this.sendInAppNotifications(orderWithItems, sellerNotifications);
    await this.sendInstantConfirmationEmails(
      orderWithItems,
      sellerNotifications,
    );
    await this.enqueueEmailNotificationJobs(
      orderWithItems,
      sellerNotifications,
    );
  }

  /**
   * Sends immediate order-confirmed email to buyer and ticket-sold emails to sellers (no invoice).
   * Invoice emails are deferred via jobs.
   */
  private async sendInstantConfirmationEmails(
    order: NonNullable<
      Awaited<ReturnType<OrdersRepository['getByIdWithItems']>>
    >,
    sellerNotifications: SellerNotificationData[],
  ): Promise<void> {
    const ev = order.event!;
    const buyerParams = {
      buyerUserId: order.userId,
      orderId: order.id,
      eventName: ev.name || 'el evento',
      eventStartDate: ev.eventStartDate
        ? new Date(ev.eventStartDate as unknown as Date)
        : undefined,
      eventEndDate: ev.eventEndDate
        ? new Date(ev.eventEndDate as unknown as Date)
        : undefined,
      venueName: ev.venueName || undefined,
      venueAddress: ev.venueAddress || undefined,
      totalAmount: String(order.totalAmount),
      subtotalAmount: String(order.subtotalAmount),
      platformCommission: String(order.platformCommission),
      vatOnCommission: String(order.vatOnCommission),
      currency: order.currency,
      items: (order.items || [])
        .filter(item => item.id && item.quantity !== null)
        .map(item => ({
          id: item.id!,
          ticketWaveName: item.ticketWaveName || 'Entrada',
          quantity: item.quantity!,
          pricePerTicket: String(item.pricePerTicket),
          subtotal: String(item.subtotal),
          currency: item.currency || undefined,
        })),
    };

    await Promise.allSettled([
      notifyOrderConfirmed(this.notificationService, buyerParams, {
        channels: ['email'],
        deferSendToJob: false,
      }),
      ...sellerNotifications.map(seller =>
        notifySellerTicketSold(this.notificationService, {
          sellerUserId: seller.sellerUserId,
          listingId: seller.listingId,
          eventName: seller.eventName,
          eventStartDate: seller.eventStartDate,
          eventEndDate: seller.eventEndDate,
          platform: seller.platform,
          qrAvailabilityTiming: seller.qrAvailabilityTiming,
          ticketCount: seller.ticketCount,
        }, { channels: ['email'], deferSendToJob: false }),
      ),
    ]).then(results => {
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          logger.error('Instant confirmation email failed', {
            orderId: order.id,
            index: i,
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          });
        }
      });
    });
  }

  private sendInAppNotifications(
    order: NonNullable<
      Awaited<ReturnType<OrdersRepository['getByIdWithItems']>>
    >,
    sellerNotifications: SellerNotificationData[],
  ): void {
    notifyOrderConfirmed(
      this.notificationService,
      {
        buyerUserId: order.userId,
        orderId: order.id,
        eventName: order.event!.name || 'el evento',
        eventStartDate: order.event?.eventStartDate
          ? new Date(order.event.eventStartDate as unknown as Date)
          : undefined,
        eventEndDate: order.event?.eventEndDate
          ? new Date(order.event.eventEndDate as unknown as Date)
          : undefined,
        venueName: order.event!.venueName || undefined,
        venueAddress: order.event!.venueAddress || undefined,
        totalAmount: String(order.totalAmount),
        subtotalAmount: String(order.subtotalAmount),
        platformCommission: String(order.platformCommission),
        vatOnCommission: String(order.vatOnCommission),
        currency: order.currency,
        items: (order.items || [])
          .filter(item => item.id && item.quantity !== null)
          .map(item => ({
            id: item.id!,
            ticketWaveName: item.ticketWaveName || 'Entrada',
            quantity: item.quantity!,
            pricePerTicket: String(item.pricePerTicket),
            subtotal: String(item.subtotal),
            currency: item.currency || undefined,
          })),
      },
      { channels: ['in_app'] },
    ).catch(err => {
      logger.error('Failed to send buyer in_app notification', {
        orderId: order.id,
        error: err instanceof Error ? err.message : String(err),
      });
    });

    for (const seller of sellerNotifications) {
      notifySellerTicketSold(
        this.notificationService,
        {
          sellerUserId: seller.sellerUserId,
          listingId: seller.listingId,
          eventName: seller.eventName,
          eventStartDate: seller.eventStartDate,
          eventEndDate: seller.eventEndDate,
          platform: seller.platform,
          qrAvailabilityTiming: seller.qrAvailabilityTiming,
          ticketCount: seller.ticketCount,
        },
        { channels: ['in_app'] },
      ).catch(err => {
        logger.error('Failed to send seller in_app notification', {
          orderId: order.id,
          sellerUserId: seller.sellerUserId,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }
  }

  private async enqueueEmailNotificationJobs(
    order: NonNullable<
      Awaited<ReturnType<OrdersRepository['getByIdWithItems']>>
    >,
    sellerNotifications: SellerNotificationData[],
  ): Promise<void> {
    const ev = order.event;
    if (!ev) return;

    const jobQueue = this.getJobQueue();
    try {
      await jobQueue.enqueue(
        'notify-order-confirmed',
        {
          orderId: order.id,
          buyerUserId: order.userId,
          eventName: ev.name || 'el evento',
          eventStartDate:
            ev.eventStartDate != null
              ? new Date(ev.eventStartDate as string | Date).toISOString()
              : undefined,
          eventEndDate:
            ev.eventEndDate != null
              ? new Date(ev.eventEndDate as string | Date).toISOString()
              : undefined,
          venueName: ev.venueName,
          venueAddress: ev.venueAddress,
          totalAmount: String(order.totalAmount),
          subtotalAmount: String(order.subtotalAmount),
          platformCommission: String(order.platformCommission),
          vatOnCommission: String(order.vatOnCommission),
          currency: order.currency,
          items: (order.items || [])
            .filter(item => item.id && item.quantity !== null)
            .map(item => ({
              id: item.id!,
              ticketWaveName: item.ticketWaveName || 'Entrada',
              quantity: item.quantity!,
              pricePerTicket: String(item.pricePerTicket),
              subtotal: String(item.subtotal),
              currency: item.currency,
            })),
        },
        `notify-order-confirmed:${order.id}`,
      );

      for (const seller of sellerNotifications) {
        await jobQueue.enqueue(
          'notify-seller-ticket-sold',
          {
            orderId: order.id,
            sellerUserId: seller.sellerUserId,
            listingId: seller.listingId,
            eventName: seller.eventName,
            eventStartDate: seller.eventStartDate.toISOString(),
            eventEndDate: seller.eventEndDate.toISOString(),
            platform: seller.platform,
            qrAvailabilityTiming: seller.qrAvailabilityTiming,
            ticketCount: seller.ticketCount,
          },
          `notify-seller-ticket-sold:${order.id}:${seller.sellerUserId}`,
        );
      }

      logger.info('Email notification jobs enqueued', { orderId: order.id });
    } catch (error) {
      logger.error('Failed to enqueue email notification jobs', {
        orderId: order.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Handles failed payment - cancels order and releases reservations
   */
  private async handleFailedPayment(
    orderId: string,
    status: string,
    paymentData: NormalizedPaymentData,
  ): Promise<void> {
    await this.ordersRepository.executeTransaction(async trx => {
      const ordersRepo = this.ordersRepository.withTransaction(trx);
      const reservationsRepo =
        this.orderTicketReservationsRepository.withTransaction(trx);

      await ordersRepo.updateStatus(orderId, 'cancelled', {
        cancelledAt: new Date(),
      });

      await reservationsRepo.releaseByOrderId(orderId);

      logger.info('Order cancelled due to payment failure', {
        orderId,
        status,
        paymentId: paymentData.providerPaymentId,
        rejectedReason: paymentData.rejectedReason || 'N/A',
        provider: this.provider.name,
      });
    });

    // Send notification to buyer (outside transaction - fire-and-forget)
    // Get order data with event name for notification
    const orderWithItems = await this.ordersRepository.getByIdWithItems(
      orderId,
    );

    if (orderWithItems && orderWithItems.event) {
      // Fire-and-forget notification (don't await to avoid blocking)
      notifyPaymentFailed(this.notificationService, {
        buyerUserId: orderWithItems.userId,
        orderId: orderWithItems.id,
        eventName: orderWithItems.event.name || 'el evento',
        errorMessage: paymentData.rejectedReason,
      }).catch(error => {
        logger.error('Failed to send payment failed notification', {
          orderId,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }
  }

  /**
   * Handles expired payment - cancels order and releases reservations
   * Sends order expired notification (different from payment failed)
   */
  private async handleExpiredPayment(
    orderId: string,
    paymentData: NormalizedPaymentData,
  ): Promise<void> {
    await this.ordersRepository.executeTransaction(async trx => {
      const ordersRepo = this.ordersRepository.withTransaction(trx);
      const reservationsRepo =
        this.orderTicketReservationsRepository.withTransaction(trx);

      await ordersRepo.updateStatus(orderId, 'cancelled', {
        cancelledAt: new Date(),
      });

      await reservationsRepo.releaseByOrderId(orderId);

      logger.info('Order cancelled due to payment expiration', {
        orderId,
        status: 'expired',
        paymentId: paymentData.providerPaymentId,
        provider: this.provider.name,
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
