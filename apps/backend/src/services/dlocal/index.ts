import axios, {type AxiosInstance} from 'axios';
import {DLOCAL_API_KEY, DLOCAL_BASE_URL, DLOCAL_SECRET_KEY} from '~/config/env';
import {
  DLOCAL_REQUEST_TIMEOUT_MS,
  DLOCAL_MAX_REDIRECTS,
  DLOCAL_PAYMENT_DESCRIPTION_MAX_LENGTH,
} from '~/constants/dlocal';

function truncateDLocalDescription(text: string) {
  if (text.length <= DLOCAL_PAYMENT_DESCRIPTION_MAX_LENGTH) return text;
  return text.slice(0, DLOCAL_PAYMENT_DESCRIPTION_MAX_LENGTH);
}
import {logger} from '~/utils';
import {redactKnownSecrets, wideEvent, withDuration} from '~/utils/logFields';
import {withRetry} from '~/utils/retry';
import type {PaymentStatus} from '@revendiste/shared';
import {roundOrderAmount} from '@revendiste/shared';
import type {
  PaymentProvider,
  CreatePaymentParams as BaseCreatePaymentParams,
  CreatePaymentResult,
  ProviderPaymentData,
} from '~/services/payments/providers/PaymentProvider.interface';
import type {
  CreatePaymentParams as DLocalCreatePaymentParams,
  DLocalPaymentResponse,
  DLocalRefundResponse,
} from './types';

// Re-export types for external consumers
export type {
  DLocalAddress,
  DLocalPayer,
  DLocalPayerResponse,
  DLocalExpirationType,
  DLocalPaymentType,
  DLocalPaymentMethod,
  DLocalRejectedReason,
  CreatePaymentParams,
  DLocalPaymentStatus,
  DLocalPaymentResponse,
  DLocalWebhookPayload,
  DLocalRefundResponse,
  DLocalRefundStatus,
} from './types';

/**
 * DLocal Payment Provider (dLocal Go API)
 *
 * Handles ONLY API communication with dLocal - no business logic.
 * API reference: https://docs.dlocalgo.com/integration-api/welcome-to-dlocal-go-api/payments/create-a-payment
 */
export class DLocalService implements PaymentProvider {
  readonly name = 'dlocal' as const;
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    // Use sandbox URL for non-production environments
    this.baseUrl = DLOCAL_BASE_URL;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: DLOCAL_REQUEST_TIMEOUT_MS,
      maxRedirects: DLOCAL_MAX_REDIRECTS,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DLOCAL_API_KEY}:${DLOCAL_SECRET_KEY}`,
      },
    });

    logger.debug('DLocal service initialized', {baseUrl: this.baseUrl});
  }

  // ========================================================================
  // PaymentProvider Interface Implementation
  // ========================================================================

  /**
   * Creates a payment (PaymentProvider interface)
   */
  async createPayment(
    params: BaseCreatePaymentParams,
  ): Promise<CreatePaymentResult> {
    // Convert base params to dLocal-specific params
    const dlocalParams: DLocalCreatePaymentParams = {
      ...params, // Spread first for any additional dLocal-specific params
      currency: params.currency as 'USD' | 'UYU',
      amount: roundOrderAmount(params.amount),
      orderId: params.orderId,
      description: params.description,
      successUrl: params.successUrl,
      backUrl: params.backUrl,
      notificationUrl: params.notificationUrl,
      expirationType: 'MINUTES',
      expirationValue: params.expirationMinutes,
      // Include payer data if provided
      payer: params.payer,
    };

    const result = await this.createDLocalPayment(dlocalParams);

    // Log the result structure before mapping
    logger.debug('dLocal createPayment result before mapping', {
      hasId: !!result.id,
      idValue: result.id,
      idType: typeof result.id,
      resultKeys: Object.keys(result),
    });

    // Validate that required fields exist
    if (!result.id) {
      logger.error(
        'payments.dlocal.create',
        wideEvent('payments.dlocal.create', {
          orderId: params.orderId,
          provider: 'dlocal',
          validationError: 'missing_id',
          outcome: 'failure',
        }),
      );
      throw new Error('dLocal payment response missing required id field');
    }

    if (!result.redirect_url) {
      logger.error(
        'payments.dlocal.create',
        wideEvent('payments.dlocal.create', {
          orderId: params.orderId,
          provider: 'dlocal',
          providerPaymentId: result.id,
          validationError: 'missing_redirect_url',
          outcome: 'failure',
        }),
      );
      throw new Error(
        'dLocal payment response missing required redirect_url field',
      );
    }

    // Convert to standard result format with normalized status
    const mappedResult = {
      ...result, // Include full dLocal response first
      id: result.id,
      redirectUrl: result.redirect_url,
      status: this.normalizeStatus(result.status),
    };

    // Log the mapped result to verify id is present
    logger.debug('dLocal createPayment mapped result', {
      hasId: !!mappedResult.id,
      idValue: mappedResult.id,
      idType: typeof mappedResult.id,
    });

    return mappedResult;
  }

  /**
   * Normalizes dLocal status to our PaymentStatus enum
   * Maps dLocal's uppercase statuses to our lowercase database enum values
   */
  normalizeStatus(dlocalStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      PENDING: 'pending',
      PAID: 'paid',
      REJECTED: 'failed',
      CANCELLED: 'cancelled',
      EXPIRED: 'expired',
    };

    return statusMap[dlocalStatus] || 'pending';
  }

  /**
   * Gets payment details (PaymentProvider interface)
   */
  async getPayment(paymentId: string): Promise<ProviderPaymentData> {
    return await this.getDLocalPayment(paymentId);
  }

  /**
   * dLocal Go may not emit expiration webhooks until the checkout URL is hit.
   * GET redirect_url triggers server-side evaluation so the next sync/webhook sees terminal status.
   */
  async forceExpirationCheck(payment: ProviderPaymentData): Promise<void> {
    const status = (payment as {status?: string}).status;
    const redirectUrl = (payment as {redirect_url?: string}).redirect_url;
    if (status !== 'PENDING' || !redirectUrl) {
      return;
    }
    const start = Date.now();
    try {
      await axios.get(redirectUrl, {
        timeout: 5000,
        maxRedirects: 0,
        validateStatus: () => true,
      });
      logger.info(
        'payments.dlocal.force_expiration',
        wideEvent('payments.dlocal.force_expiration', {
          paymentId: payment.id,
          ...withDuration(start),
          outcome: 'success',
        }),
      );
    } catch (error) {
      logger.warn(
        'payments.dlocal.force_expiration',
        wideEvent('payments.dlocal.force_expiration', {
          paymentId: payment.id,
          errorMessage: error instanceof Error ? error.message : String(error),
          ...withDuration(start),
          outcome: 'failure',
        }),
      );
    }
  }

  // ========================================================================
  // DLocal-Specific Methods
  // ========================================================================

  /**
   * Creates a payment with dLocal-specific parameters.
   * @see https://docs.dlocalgo.com/integration-api/welcome-to-dlocal-go-api/payments/create-a-payment
   */
  async createDLocalPayment(
    params: DLocalCreatePaymentParams,
  ): Promise<DLocalPaymentResponse> {
    const start = Date.now();
    try {
      // Build request body with only provided parameters
      const requestBody: Record<string, unknown> = {
        currency: params.currency,
        amount: params.amount,
        success_url: params.successUrl,
        back_url: params.backUrl,
        expiration_type: params.expirationType,
        expiration_value: params.expirationValue,
      };

      // Add optional fields only if provided
      if (params.country) requestBody.country = params.country;
      if (params.orderId) requestBody.order_id = params.orderId;
      if (params.payer) requestBody.payer = params.payer;
      if (params.description) {
        requestBody.description = truncateDLocalDescription(params.description);
      }
      if (params.notificationUrl)
        requestBody.notification_url = params.notificationUrl;
      if (params.paymentType)
        requestBody.payment_type = params.paymentType.join(', ');
      if (params.maxInstallments)
        requestBody.max_installments = params.maxInstallments;
      if (params.acceptedBins) requestBody.accepted_bins = params.acceptedBins;
      if (params.rejectedBins) requestBody.rejected_bins = params.rejectedBins;

      const response = await withRetry(
        () =>
          this.client.post<DLocalPaymentResponse>('/v1/payments', requestBody),
        {
          maxAttempts: 3,
          baseDelayMs: 1000,
          shouldRetry: err =>
            !axios.isAxiosError(err) ||
            err.response == null ||
            (err.response.status != null && err.response.status >= 500),
        },
      ).then(r => r.data);

      logger.info(
        'payments.dlocal.create',
        wideEvent('payments.dlocal.create', {
          orderId: params.orderId,
          provider: 'dlocal',
          providerPaymentId: response.id,
          amount: params.amount,
          currency: params.currency,
          expirationMinutes: params.expirationValue,
          hasPayer: Boolean(params.payer),
          ...withDuration(start),
          outcome: 'success',
        }),
      );

      return response;
    } catch (error: unknown) {
      const msg =
        axios.isAxiosError(error) &&
        (error.response?.data as {message?: string})?.message != null
          ? (error.response?.data as {message: string}).message
          : error instanceof Error
            ? error.message
            : String(error);
      logger.error(
        'payments.dlocal.create',
        wideEvent('payments.dlocal.create', {
          orderId: params.orderId,
          provider: 'dlocal',
          amount: params.amount,
          currency: params.currency,
          hasPayer: Boolean(params.payer),
          error: redactKnownSecrets(
            axios.isAxiosError(error)
              ? (error.response?.data ?? {message: error.message})
              : error instanceof Error
                ? {message: error.message, name: error.name}
                : {message: String(error)},
          ),
          ...withDuration(start),
          outcome: 'failure',
        }),
      );
      throw new Error(`Failed to create payment: ${msg}`);
    }
  }

  // ========================================================================
  // Refund Methods
  // ========================================================================

  /**
   * Creates a refund for a payment in dLocal.
   * @see https://docs.dlocalgo.com/integration-api/welcome-to-dlocal-go-api/refunds
   */
  async createRefund(params: {
    paymentId: string;
    amount?: number;
    currency?: string;
    reason?: string;
  }): Promise<DLocalRefundResponse> {
    const start = Date.now();
    try {
      const requestBody: Record<string, unknown> = {
        payment_id: params.paymentId,
      };
      if (params.amount !== undefined) requestBody.amount = params.amount;
      if (params.currency) requestBody.currency = params.currency;
      if (params.reason) requestBody.reason = params.reason;

      const response = await withRetry(
        () =>
          this.client.post<DLocalRefundResponse>('/v1/refunds', requestBody),
        {
          maxAttempts: 3,
          baseDelayMs: 1000,
          shouldRetry: err =>
            !axios.isAxiosError(err) ||
            err.response == null ||
            (err.response.status != null && err.response.status >= 500),
        },
      ).then(r => r.data);

      logger.info(
        'payments.dlocal.refund',
        wideEvent('payments.dlocal.refund', {
          paymentId: params.paymentId,
          refundId: response.id,
          amount: params.amount,
          currency: params.currency,
          refundStatus: response.status,
          ...withDuration(start),
          outcome: 'success',
        }),
      );

      return response;
    } catch (error: unknown) {
      const msg =
        axios.isAxiosError(error) &&
        (error.response?.data as {message?: string})?.message != null
          ? (error.response?.data as {message: string}).message
          : error instanceof Error
            ? error.message
            : String(error);
      logger.error(
        'payments.dlocal.refund',
        wideEvent('payments.dlocal.refund', {
          paymentId: params.paymentId,
          amount: params.amount,
          error: redactKnownSecrets(
            axios.isAxiosError(error)
              ? (error.response?.data ?? {message: error.message})
              : error instanceof Error
                ? {message: error.message, name: error.name}
                : {message: String(error)},
          ),
          ...withDuration(start),
          outcome: 'failure',
        }),
      );
      throw new Error(`Failed to create refund: ${msg}`);
    }
  }

  /**
   * Gets refund details from dLocal
   */
  async getRefund(refundId: string): Promise<DLocalRefundResponse> {
    const start = Date.now();
    try {
      const response = await withRetry(
        () => this.client.get<DLocalRefundResponse>(`/v1/refunds/${refundId}`),
        {
          maxAttempts: 3,
          baseDelayMs: 1000,
          shouldRetry: err =>
            !axios.isAxiosError(err) ||
            err.response == null ||
            (err.response.status != null && err.response.status >= 500),
        },
      ).then(r => r.data);

      logger.debug(
        'payments.dlocal.refund_lookup',
        wideEvent('payments.dlocal.refund_lookup', {
          refundId,
          refundStatus: response.status,
          ...withDuration(start),
          outcome: 'success',
        }),
      );

      return response;
    } catch (error: unknown) {
      const msg =
        axios.isAxiosError(error) &&
        (error.response?.data as {message?: string})?.message != null
          ? (error.response?.data as {message: string}).message
          : error instanceof Error
            ? error.message
            : String(error);
      logger.error(
        'payments.dlocal.refund_lookup',
        wideEvent('payments.dlocal.refund_lookup', {
          refundId,
          error: redactKnownSecrets(
            axios.isAxiosError(error)
              ? (error.response?.data ?? {message: error.message})
              : error instanceof Error
                ? {message: error.message, name: error.name}
                : {message: String(error)},
          ),
          ...withDuration(start),
          outcome: 'failure',
        }),
      );
      throw new Error(`Failed to retrieve refund: ${msg}`);
    }
  }

  /**
   * Gets payment details from dLocal
   */
  async getDLocalPayment(paymentId: string): Promise<DLocalPaymentResponse> {
    const start = Date.now();
    try {
      const response = await withRetry(
        () =>
          this.client.get<DLocalPaymentResponse>(`/v1/payments/${paymentId}`),
        {
          maxAttempts: 3,
          baseDelayMs: 1000,
          shouldRetry: err =>
            !axios.isAxiosError(err) ||
            err.response == null ||
            (err.response.status != null && err.response.status >= 500),
        },
      ).then(r => r.data);

      logger.debug(
        'payments.dlocal.fetch',
        wideEvent('payments.dlocal.fetch', {
          providerPaymentId: paymentId,
          paymentStatus: response.status,
          ...withDuration(start),
          outcome: 'success',
        }),
      );

      return response;
    } catch (error: unknown) {
      const msg =
        axios.isAxiosError(error) &&
        (error.response?.data as {message?: string})?.message != null
          ? (error.response?.data as {message: string}).message
          : error instanceof Error
            ? error.message
            : String(error);
      logger.error(
        'payments.dlocal.fetch',
        wideEvent('payments.dlocal.fetch', {
          providerPaymentId: paymentId,
          error: redactKnownSecrets(
            axios.isAxiosError(error)
              ? (error.response?.data ?? {message: error.message})
              : error instanceof Error
                ? {message: error.message, name: error.name}
                : {message: String(error)},
          ),
          ...withDuration(start),
          outcome: 'failure',
        }),
      );
      throw new Error(`Failed to retrieve payment: ${msg}`);
    }
  }
}
