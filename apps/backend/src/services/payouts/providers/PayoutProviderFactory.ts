import type {PayoutType} from '@revendiste/shared';
import type {PayoutProviderName} from './PayoutProvider.interface';

export function payoutProviderNameForMethod(
  payoutType: PayoutType,
): PayoutProviderName {
  switch (payoutType) {
    case 'uruguayan_bank':
      return 'manual_bank';
    default: {
      const _exhaustive: never = payoutType;
      return _exhaustive;
    }
  }
}
