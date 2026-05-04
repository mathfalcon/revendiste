import type {
  EventTicketCurrency,
  PayoutStatus,
  PayoutType,
} from '@revendiste/shared';

export type PayoutProviderName = 'dlocal_go' | 'manual_bank';

export interface InitiatePayoutInstructions {
  /** Human-readable summary for admin / logs */
  summary: string;
}

export interface InitiatePayoutParams {
  payoutId: string;
  amount: number;
  currency: EventTicketCurrency;
  payoutType: PayoutType;
  payoutMethodCurrency: EventTicketCurrency;
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
  payoutType: PayoutType;
  payoutMethodCurrency: EventTicketCurrency;
  /** Merged `payouts.metadata` (quote locks, etc.) */
  payoutMetadata: unknown;
  payoutMethodMetadata: unknown;
  accountHolderName: string;
  accountHolderSurname: string;
}

export interface ProcessPayoutResult {
  status: PayoutStatus;
  externalId?: string;
  /** Optional hints from provider submit response (e.g. dLocal Go) merged into fxExecution */
  providerExecutionHints?: {
    actualRate?: number;
    providerFees?: number;
  };
}

export interface PayoutStatusResult {
  status: PayoutStatus;
  rawStatus?: string;
}

/**
 * Strategy for payout execution (manual today; API-driven with dLocal Go / Payouts v3 when enabled).
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
