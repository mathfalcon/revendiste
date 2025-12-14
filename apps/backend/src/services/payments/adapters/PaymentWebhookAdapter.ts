import type {Kysely} from 'kysely';
import type {DB} from '~/shared';
import {
  OrdersRepository,
  OrderTicketReservationsRepository,
  PaymentsRepository,
  PaymentEventsRepository,
  ListingTicketsRepository,
  TicketListingsRepository,
  EventsRepository,
  EventTicketWavesRepository,
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
import {TicketListingsService} from '~/services/ticket-listings';

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
  metadata: any;
}

export interface WebhookMetadata {
  ipAddress?: string;
  userAgent?: string;
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
 */
export class PaymentWebhookAdapter {
  private ordersRepository: OrdersRepository;
  private orderTicketReservationsRepository: OrderTicketReservationsRepository;
  private paymentsRepository: PaymentsRepository;
  private paymentEventsRepository: PaymentEventsRepository;
  private listingTicketsRepository: ListingTicketsRepository;
  private ticketListingsRepository: TicketListingsRepository;
  private ticketListingsService: TicketListingsService;

  constructor(private provider: PaymentProvider, private db: Kysely<DB>) {
    this.ordersRepository = new OrdersRepository(db);
    this.orderTicketReservationsRepository =
      new OrderTicketReservationsRepository(db);
    this.paymentsRepository = new PaymentsRepository(db);
    this.paymentEventsRepository = new PaymentEventsRepository(db);
    this.listingTicketsRepository = new ListingTicketsRepository(db);
    this.ticketListingsRepository = new TicketListingsRepository(db);
    this.ticketListingsService = new TicketListingsService(
      this.ticketListingsRepository,
      new EventsRepository(db),
      new EventTicketWavesRepository(db),
      this.listingTicketsRepository,
      this.ordersRepository,
      db,
    );
  }

  /**
   * Main webhook processing method
   * This is the public API that services call
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

      // Step 1: Fetch payment from provider (provider-specific)
      const providerPayment = await this.provider.getPayment(paymentId);

      // Step 2: Normalize to our format (provider-specific)
      const normalized = this.normalizePaymentData(providerPayment);

      // Step 3: Process with our business logic (common)
      await this.processNormalizedPayment(normalized, webhookMetadata);

      logger.info('Webhook processed successfully', {
        provider: this.provider.name,
        paymentId: normalized.providerPaymentId,
        status: normalized.status,
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
   */
  private async processNormalizedPayment(
    paymentData: NormalizedPaymentData,
    webhookMetadata?: WebhookMetadata,
  ): Promise<void> {
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
    if (Number(paymentData.amount) !== Number(order.totalAmount)) {
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

    paymentRecord = await this.paymentsRepository.update(
      String(paymentRecord.id),
      {
        status: newStatus as any,
        balanceAmount: paymentData.balanceAmount
          ? String(paymentData.balanceAmount)
          : undefined,
        balanceFee: paymentData.balanceFee
          ? String(paymentData.balanceFee)
          : undefined,
        balanceCurrency: paymentData.balanceCurrency,
        paymentMethod: paymentData.paymentMethod as any,
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

    // Log events
    if (String(oldStatus) !== String(newStatus)) {
      await this.paymentEventsRepository.logStatusChange(
        String(paymentRecord.id),
        String(oldStatus),
        String(newStatus),
        paymentData.metadata,
        webhookMetadata,
      );
    }

    await this.paymentEventsRepository.logWebhookReceived(
      String(paymentRecord.id),
      paymentData.metadata,
      webhookMetadata,
    );

    // Handle order status based on payment status
    await this.handleOrderStatusUpdate(order.id, newStatus, paymentData);
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
      case 'expired':
        await this.handleFailedPayment(orderId, status, paymentData);
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
   * Handles successful payment - confirms order and reservations
   */
  private async handleSuccessfulPayment(
    orderId: string,
    paymentData: NormalizedPaymentData,
  ): Promise<void> {
    let soldTickets: Array<{listingId: string}> = [];
    let uniqueListingIds: string[] = [];

    await this.ordersRepository.executeTransaction(async trx => {
      const ordersRepo = this.ordersRepository.withTransaction(trx);
      const reservationsRepo =
        this.orderTicketReservationsRepository.withTransaction(trx);

      // Step 1: Update order status to confirmed
      await ordersRepo.updateStatus(orderId, 'confirmed', {
        confirmedAt: new Date(),
      });

      // Step 2: Confirm order reservations (marks them as deleted)
      await reservationsRepo.confirmOrderReservations(orderId);

      // Step 3: Mark tickets as sold (notifications sent outside transaction by service)
      soldTickets =
        await this.ticketListingsService.markTicketsAsSoldAndNotifySellers(
          orderId,
        );

      // Step 4: Get unique listing IDs from sold tickets
      uniqueListingIds = [
        ...new Set(soldTickets.map(ticket => ticket.listingId)),
      ];

      // Step 5: Check if all tickets from each listing are sold and mark listings as sold
      const soldListings =
        await this.ticketListingsRepository.checkAndMarkListingsAsSold(
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
  }
}
