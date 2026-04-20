import type {EventTicketCurrency, PayoutStatus} from '@revendiste/shared';
import type {
  InitiatePayoutParams,
  InitiatePayoutResult,
  PayoutProvider,
  ProcessPayoutParams,
  ProcessPayoutResult,
  PayoutStatusResult,
} from './PayoutProvider.interface';

/**
 * Template-method base for payout providers: shared currency / FX rules.
 * Subclasses implement initiatePayout, processPayout, getPayoutStatus, normalizeStatus, name.
 */
export abstract class BasePayoutProvider implements PayoutProvider {
  abstract readonly name: PayoutProvider['name'];

  abstract initiatePayout(
    params: InitiatePayoutParams,
  ): Promise<InitiatePayoutResult>;

  abstract processPayout(
    params: ProcessPayoutParams,
  ): Promise<ProcessPayoutResult>;

  abstract getPayoutStatus(externalId: string): Promise<PayoutStatusResult>;

  abstract normalizeStatus(providerStatus: string): PayoutStatus;

  supportsCurrency(currency: EventTicketCurrency): boolean {
    return currency === 'UYU' || currency === 'USD';
  }

  requiresFxConversion(
    sourceCurrency: EventTicketCurrency,
    targetCurrency: EventTicketCurrency,
  ): boolean {
    return sourceCurrency !== targetCurrency;
  }
}
