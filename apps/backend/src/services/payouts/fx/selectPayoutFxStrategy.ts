import type {EventTicketCurrency} from '@revendiste/shared';
import type {PayoutProviderName} from '~/services/payouts/providers/PayoutProvider.interface';
import {ManualUsdFromUyuStrategy} from './ManualUsdFromUyuStrategy';
import {NoFxStrategy} from './NoFxStrategy';
import type {PayoutFxStrategy} from './types';

const noFx = new NoFxStrategy();
const manualUsdFromUyu = new ManualUsdFromUyuStrategy();

/**
 * Resolves FX strategy for payout request. dLocal-quote strategy registers here on rollout.
 */
export function selectPayoutFxStrategy(input: {
  payoutType: 'uruguayan_bank' | 'argentinian_bank';
  providerName: PayoutProviderName;
  destinationCurrency: EventTicketCurrency;
  sourceCurrency: EventTicketCurrency;
}): PayoutFxStrategy {
  if (input.payoutType !== 'uruguayan_bank') {
    return noFx;
  }
  if (input.destinationCurrency === 'USD' && input.sourceCurrency === 'UYU') {
    return manualUsdFromUyu;
  }
  return noFx;
}
