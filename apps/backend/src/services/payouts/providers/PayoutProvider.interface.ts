import type {EventTicketCurrency, PayoutStatus} from '@revendiste/shared';

/** DB / future: only `manual_bank` is persisted until dLocal migration. */
export type PayoutProviderName = 'manual_bank' | 'dlocal_automated';

export interface InitiatePayoutInstructions {
  /** Human-readable summary for admin / logs */
  summary: string;
}

export interface InitiatePayoutParams {
  payoutId: string;
  amount: number;
  currency: EventTicketCurrency;
  payoutMethodMetadata: unknown;
  accountHolderName: string;
  accountHolderSurname: string;
}

export interface InitiatePayoutResult {
  instructions: InitiatePayoutInstructions;
  externalId?: string;
}

export interface ProcessPayoutParams {
  payoutId: string;
  amount: number;
  currency: EventTicketCurrency;
  payoutMethodMetadata: unknown;
  accountHolderName: string;
  accountHolderSurname: string;
}

export interface ProcessPayoutResult {
  status: PayoutStatus;
  externalId?: string;
}

export interface PayoutStatusResult {
  status: PayoutStatus;
  rawStatus?: string;
}

/**
 * Strategy for payout execution (manual today; API-driven later).
 * Implementations must not perform DB transactions — orchestration stays in PayoutsService.
 */
export interface PayoutProvider {
  readonly name: PayoutProviderName;

  initiatePayout(params: InitiatePayoutParams): Promise<InitiatePayoutResult>;

  /** Called before marking a payout completed (e.g. trigger API transfer). */
  processPayout(params: ProcessPayoutParams): Promise<ProcessPayoutResult>;

  getPayoutStatus(_externalId: string): Promise<PayoutStatusResult>;

  normalizeStatus(providerStatus: string): PayoutStatus;

  supportsCurrency(currency: EventTicketCurrency): boolean;

  requiresFxConversion(
    sourceCurrency: EventTicketCurrency,
    targetCurrency: EventTicketCurrency,
  ): boolean;
}
