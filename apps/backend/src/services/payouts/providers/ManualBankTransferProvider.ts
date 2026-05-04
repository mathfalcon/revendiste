import type {PayoutStatus} from '@revendiste/shared';
import {BasePayoutProvider} from './BasePayoutProvider';
import type {
  InitiatePayoutParams,
  InitiatePayoutResult,
  ProcessPayoutParams,
  ProcessPayoutResult,
  PayoutStatusResult,
} from './PayoutProvider.interface';

export class ManualBankTransferProvider extends BasePayoutProvider {
  readonly name = 'manual_bank' as const;

  async initiatePayout(
    params: InitiatePayoutParams,
  ): Promise<InitiatePayoutResult> {
    const summary = `Transferencia bancaria: ${params.amount} ${params.currency} (${params.payoutType}) a ${params.accountHolderName} ${params.accountHolderSurname}. Usá los datos del método de retiro en el panel de administración.`;
    return {
      instructions: {summary},
      externalId: undefined,
    };
  }

  async processPayout(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _params: ProcessPayoutParams,
  ): Promise<ProcessPayoutResult> {
    return {status: 'completed', externalId: undefined};
  }

  async getPayoutStatus(_externalId: string): Promise<PayoutStatusResult> {
    return {status: 'pending'};
  }

  normalizeStatus(_providerStatus: string): PayoutStatus {
    return 'pending';
  }
}
