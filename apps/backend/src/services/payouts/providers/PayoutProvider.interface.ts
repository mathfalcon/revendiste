import type {EventTicketCurrency, PayoutStatus} from '@revendiste/shared';

export type PayoutProviderName = 'manual_bank';

export interface InitiatePayoutParams {
  payoutId: string;
  amount: number;
  currency: EventTicketCurrency;
  payoutMethodMetadata: unknown;
  accountHolderName: string;
  accountHolderSurname: string;
}

export interface InitiatePayoutResult {
  instructions: string;
  providerReference?: string;
}

export interface PayoutStatusResult {
  status: PayoutStatus;
  rawStatus?: string;
}

/**
 * Abstraction for payout execution (manual today; API-driven later).
 * V1: returns human-readable instructions for admin processing.
 */
export interface PayoutProvider {
  readonly name: PayoutProviderName;

  initiatePayout(params: InitiatePayoutParams): Promise<InitiatePayoutResult>;

  getPayoutStatus(_externalId: string): Promise<PayoutStatusResult>;

  normalizeStatus(providerStatus: string): PayoutStatus;

  supportsCurrency(currency: EventTicketCurrency): boolean;

  requiresFxConversion(
    sourceCurrency: EventTicketCurrency,
    targetCurrency: EventTicketCurrency,
  ): boolean;
}
