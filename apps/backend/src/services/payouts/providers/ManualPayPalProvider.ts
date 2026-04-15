import type {EventTicketCurrency, PayoutStatus} from '@revendiste/shared';
import type {
  InitiatePayoutParams,
  InitiatePayoutResult,
  PayoutProvider,
  PayoutStatusResult,
} from './PayoutProvider.interface';

export class ManualPayPalProvider implements PayoutProvider {
  readonly name = 'manual_paypal' as const;

  async initiatePayout(params: InitiatePayoutParams): Promise<InitiatePayoutResult> {
    return {
      instructions: `PayPal (manual): enviar ${params.amount} ${params.currency} al correo configurado en el método de retiro. Titular: ${params.accountHolderName} ${params.accountHolderSurname}.`,
    };
  }

  async getPayoutStatus(_externalId: string): Promise<PayoutStatusResult> {
    return {status: 'pending'};
  }

  normalizeStatus(_providerStatus: string): PayoutStatus {
    return 'pending';
  }

  supportsCurrency(currency: EventTicketCurrency): boolean {
    return currency === 'USD';
  }

  requiresFxConversion(
    sourceCurrency: EventTicketCurrency,
    targetCurrency: EventTicketCurrency,
  ): boolean {
    return sourceCurrency === 'UYU' && targetCurrency === 'USD';
  }
}
