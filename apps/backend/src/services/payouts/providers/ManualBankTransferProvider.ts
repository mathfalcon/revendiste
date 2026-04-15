import type {EventTicketCurrency, PayoutStatus} from '@revendiste/shared';
import type {
  InitiatePayoutParams,
  InitiatePayoutResult,
  PayoutProvider,
  PayoutStatusResult,
} from './PayoutProvider.interface';

export class ManualBankTransferProvider implements PayoutProvider {
  readonly name = 'manual_bank' as const;

  async initiatePayout(params: InitiatePayoutParams): Promise<InitiatePayoutResult> {
    return {
      instructions: `Transferencia bancaria Uruguay: ${params.amount} ${params.currency} a ${params.accountHolderName} ${params.accountHolderSurname}. Usá los datos del método de retiro en el panel de administración.`,
    };
  }

  async getPayoutStatus(_externalId: string): Promise<PayoutStatusResult> {
    return {status: 'pending'};
  }

  normalizeStatus(_providerStatus: string): PayoutStatus {
    return 'pending';
  }

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
