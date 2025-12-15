import type {
  PaymentStatus,
  PaymentProvider as PaymentProviderEnum,
} from '@revendiste/shared';

/**
 * Payment data in the provider's native format
 * Each provider returns their own structure
 */
export interface ProviderPaymentData {
  id: string;
  status: string;
  amount: number;
  currency: string;
  [key: string]: any; // Allow provider-specific fields
}

/**
 * Parameters for creating a payment
 */
export interface CreatePaymentParams {
  orderId: string;
  amount: number;
  currency: string;
  description?: string;
  successUrl: string;
  backUrl: string;
  notificationUrl?: string;
  expirationMinutes: number;
  [key: string]: any; // Allow provider-specific parameters
}

/**
 * Result from creating a payment with normalized status
 */
export interface CreatePaymentResult {
  id: string;
  redirectUrl: string;
  status: PaymentStatus; // Now properly typed!
  [key: string]: any; // Allow provider-specific fields
}

/**
 * Simple interface that all payment providers must implement
 * Providers should ONLY handle API communication, no business logic
 */
export interface PaymentProvider {
  /**
   * Unique identifier for this provider (e.g., 'dlocal', 'stripe', 'paypal')
   */
  readonly name: PaymentProviderEnum;

  /**
   * Creates a payment with the provider
   * @returns Payment data with normalized status
   */
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;

  /**
   * Retrieves payment details from the provider
   * @returns Payment data in provider's native format
   */
  getPayment(paymentId: string): Promise<ProviderPaymentData>;

  /**
   * Normalizes provider-specific status to our PaymentStatus enum
   * Each provider must implement this to map their statuses to our standard ones
   */
  normalizeStatus(providerStatus: string): PaymentStatus;
}
