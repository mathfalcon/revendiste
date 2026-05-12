import type {EventTicketCurrency} from '@revendiste/shared';
import type {FxSnapshot} from '@revendiste/shared';
import type {PayoutProviderName} from '~/services/payouts/providers/PayoutProvider.interface';

export type PayoutFxExecutor = FxSnapshot['executor'];

export interface FxStrategyContext {
  readonly providerName: PayoutProviderName;
  readonly payoutType: 'uruguayan_bank' | 'argentinian_bank';
  readonly destinationCurrency: EventTicketCurrency;
  readonly destinationAmount: number;
  /** Processor-side currency we hold (UYU for dLocal Go inflows today) */
  readonly sourceCurrency: EventTicketCurrency;
  readonly sourceAmount: number;
}

export interface PayoutFxStrategy {
  readonly id: string;

  buildSnapshot(ctx: FxStrategyContext): Promise<FxSnapshot | null>;
}
