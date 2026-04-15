import type {PayoutType} from '@revendiste/shared';
import type {PayoutProvider, PayoutProviderName} from './PayoutProvider.interface';
import {ManualBankTransferProvider} from './ManualBankTransferProvider';
import {ManualPayPalProvider} from './ManualPayPalProvider';

export function getPayoutProviderForMethod(
  payoutType: PayoutType,
): PayoutProvider {
  switch (payoutType) {
    case 'paypal':
      return new ManualPayPalProvider();
    case 'uruguayan_bank':
      return new ManualBankTransferProvider();
    default: {
      const _exhaustive: never = payoutType;
      return _exhaustive;
    }
  }
}

export function payoutProviderNameForMethod(
  payoutType: PayoutType,
): PayoutProviderName {
  return payoutType === 'paypal' ? 'manual_paypal' : 'manual_bank';
}
