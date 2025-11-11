/**
 * Payer's address information
 */
export interface DLocalAddress {
  /** Payer's address state */
  state?: string;
  /** Payer's address city */
  city?: string;
  /** Payer's address zip code */
  zip_code?: string;
  /** Payer's full address */
  full_address?: string;
}

/**
 * Payer information for dLocal payment
 * All attributes will be mandatory in the checkout process if not provided
 */
export interface DLocalPayer {
  /** Unique identifier for the payer on merchant's side */
  id?: string;
  /** Full name of the payer (max 100 chars) */
  name?: string;
  /** Email address of the payer (max 100 chars) */
  email?: string;
  /** Payer's phone number (max 100 chars) */
  phone?: string;
  /** Payer's document type (must be valid for the country) */
  document_type?: string;
  /** Payer's document number */
  document?: string;
  /** Unique payer identifier on merchant's side */
  user_reference?: string;
  /** Payer's address */
  address?: DLocalAddress;
}

/**
 * Payment expiration time granularity
 */
export type DLocalExpirationType = 'MINUTES' | 'HOURS' | 'DAYS';

/**
 * Payment method types available in dLocal
 */
export type DLocalPaymentType =
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'BANK_TRANSFER'
  | 'VOUCHER';

/**
 * Parameters for creating a dLocal payment
 */
export interface CreatePaymentParams {
  /** Three-letter ISO-4217 currency code (uppercase) */
  currency: 'USD' | 'UYU';
  /** Transaction amount in the specified currency */
  amount: number;
  /** User's country code (ISO 3166-1 alpha-2). Optional - checkout will prompt if not provided */
  country?: string;
  /** Merchant-side payment identifier (max 128 chars). Auto-generated if not provided */
  orderId?: string;
  /** Information about the payer */
  payer?: DLocalPayer;
  /** Description of the payment (max 100 chars) */
  description?: string;
  /** URL where dLocal redirects upon successful payment (max 2048 chars) */
  successUrl: string;
  /** Merchant website URL to which the client is returned (max 2048 chars) */
  backUrl: string;
  /** Notification URL for payment status changes (max 2048 chars) */
  notificationUrl?: string;
  /** Expiration time granularity */
  expirationType: DLocalExpirationType;
  /** Expiration value (e.g., 10 for 10 minutes) */
  expirationValue: number;
  /** Comma-separated payment methods to enable */
  paymentType?: DLocalPaymentType[];
  /** Maximum number of installments offered */
  maxInstallments?: number;
  /** Restrict card payments to specific BINs (6-8 digit strings) */
  acceptedBins?: string[];
  /** Exclude specific BINs from card payments (6-8 digit strings) */
  rejectedBins?: string[];
}

/**
 * dLocal payment status
 */
export type DLocalPaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

/**
 * Payment type used by the customer
 */
export type DLocalPaymentMethod = 'VOUCHER' | 'BANK_TRANSFER' | 'CREDIT_CARD';

/**
 * Reason for payment rejection
 */
export type DLocalRejectedReason =
  | 'DOCUMENT_INVALID'
  | 'INSUFFICIENT_FUNDS'
  | 'CARD_EXPIRED'
  | 'TRANSACTION_NOT_ALLOWED'
  | string; // Allow other reasons as dLocal may add more

/**
 * Payer information in payment response
 * Note: Different from DLocalPayer used in requests
 */
export interface DLocalPayerResponse {
  /** Payer's first name */
  first_name?: string;
  /** Payer's last name */
  last_name?: string;
  /** Payer's email */
  email?: string;
  /** Payer's document type */
  document_type?: string;
  /** Payer's document number */
  document?: string;
}

/**
 * Response from dLocal payment creation and retrieval
 */
export interface DLocalPaymentResponse {
  /** Payment ID */
  id: string;
  /** Transaction amount */
  amount: number;
  /** Three-letter ISO-4217 currency code (uppercase) */
  currency: string;
  /** Amount credited to merchant account */
  balance_amount?: number;
  /** Commission paid for this transaction */
  balance_fee?: number;
  /** Three-letter ISO-4217 currency code of merchant's balance (uppercase) */
  balance_currency?: string;
  /** Payer's country code (ISO 3166-1 alpha-2) */
  country: string;
  /** Payment description */
  description: string;
  /** Payment creation date (ISO 8601 with timezone) */
  created_date: string;
  /** Payment approval date (ISO 8601 with timezone) */
  approved_date?: string;
  /** Payment status */
  status: DLocalPaymentStatus;
  /** Merchant's order ID */
  order_id: string;
  /** Notification URL */
  notification_url?: string;
  /** Success redirect URL */
  success_url: string;
  /** Back URL */
  back_url: string;
  /** URL to redirect user to complete payment (expires after 24h) */
  redirect_url: string;
  /** Checkout token */
  merchant_checkout_token: string;
  /** Whether payment is direct */
  direct: boolean;
  /** Payment method used (only if payment_method was set during creation) */
  payment_type?: DLocalPaymentMethod;
  /** Reason for rejection (only present if status is PENDING or REJECTED) */
  rejected_reason?: DLocalRejectedReason;
  /** Payer information */
  payer?: DLocalPayerResponse;
}

/**
 * Webhook notification payload from dLocal
 */
export interface DLocalWebhookPayload {
  /** Payment ID that changed status */
  payment_id: string;
}
