import axios, {type AxiosInstance} from 'axios';
import {DLOCAL_API_KEY, DLOCAL_BASE_URL, DLOCAL_SECRET_KEY} from '~/config/env';
import {logger} from '~/utils';
import type {PaymentStatus} from '~/types/db';
import type {
  PaymentProvider,
  CreatePaymentParams as BaseCreatePaymentParams,
  CreatePaymentResult,
  ProviderPaymentData,
} from '~/services/payments/providers/PaymentProvider.interface';
import type {
  CreatePaymentParams as DLocalCreatePaymentParams,
  DLocalPaymentResponse,
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
} from './types';

/**
 * DLocal Payment Provider
 * Handles ONLY API communication with dLocal - no business logic
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
      amount: params.amount,
      orderId: params.orderId,
      description: params.description,
      successUrl: params.successUrl,
      backUrl: params.backUrl,
      notificationUrl: params.notificationUrl,
      expirationType: 'MINUTES',
      expirationValue: params.expirationMinutes,
    };

    const result = await this.createDLocalPayment(dlocalParams);

    // Convert to standard result format with normalized status
    return {
      ...result, // Include full dLocal response first
      id: result.id,
      redirectUrl: result.redirect_url,
      status: this.normalizeStatus(result.status),
    };
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

  // ========================================================================
  // DLocal-Specific Methods
  // ========================================================================

  /**
   * Creates a payment with dLocal-specific parameters
   */
  async createDLocalPayment(
    params: DLocalCreatePaymentParams,
  ): Promise<DLocalPaymentResponse> {
    try {
      logger.info('Creating dLocal payment', {
        orderId: params.orderId,
        amount: params.amount,
        currency: params.currency,
      });

      // Build request body with only provided parameters
      const requestBody: Record<string, any> = {
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
      if (params.description) requestBody.description = params.description;
      if (params.notificationUrl)
        requestBody.notification_url = params.notificationUrl;
      if (params.paymentType)
        requestBody.payment_type = params.paymentType.join(', ');
      if (params.maxInstallments)
        requestBody.max_installments = params.maxInstallments;
      if (params.acceptedBins) requestBody.accepted_bins = params.acceptedBins;
      if (params.rejectedBins) requestBody.rejected_bins = params.rejectedBins;
      console.log(JSON.stringify(requestBody, null, 2));

      const response = await this.client.post<DLocalPaymentResponse>(
        '/v1/payments',
        requestBody,
      );

      console.log(JSON.stringify(response.data, null, 2));

      logger.info('dLocal payment created successfully', {
        paymentId: response.data.id,
        orderId: params.orderId,
        redirectUrl: response.data.redirect_url,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to create dLocal payment', {
        orderId: params.orderId,
        error: error.response?.data || error.message,
      });
      console.error(error.response.data);

      throw new Error(
        `Failed to create payment: ${
          error.response?.data?.message || error.message
        }`,
      );
    }
  }

  /**
   * Gets payment details from dLocal
   */
  async getDLocalPayment(paymentId: string): Promise<DLocalPaymentResponse> {
    try {
      const response = await this.client.get<DLocalPaymentResponse>(
        `/v1/payments/${paymentId}`,
      );

      return response.data;
    } catch (error: any) {
      logger.error('Failed to retrieve dLocal payment', {
        paymentId,
        error: error.response?.data || error.message,
      });

      throw new Error(
        `Failed to retrieve payment: ${
          error.response?.data?.message || error.message
        }`,
      );
    }
  }
}
