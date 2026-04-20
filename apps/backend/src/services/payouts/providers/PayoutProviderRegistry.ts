import type {PayoutType} from '@revendiste/shared';
import {ValidationError} from '~/errors';
import {PAYOUT_ERROR_MESSAGES} from '~/constants/error-messages';
import {ManualBankTransferProvider} from './ManualBankTransferProvider';
import type {
  PayoutProvider,
  PayoutProviderName,
} from './PayoutProvider.interface';

const manualBankProvider = new ManualBankTransferProvider();

const PROVIDERS: Partial<Record<PayoutProviderName, PayoutProvider>> = {
  manual_bank: manualBankProvider,
};

/**
 * Resolves which provider name to persist for a payout method type.
 * Phase 2: gate `uruguayan_bank` with a feature flag → `dlocal_automated`.
 */
export function resolveProviderName(
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

export function selectPayoutProvider(payoutMethod: {
  payoutType: PayoutType;
}): PayoutProvider {
  const name = resolveProviderName(payoutMethod.payoutType);
  return getPayoutProviderByName(name);
}

export function getPayoutProviderByName(
  name: PayoutProviderName,
): PayoutProvider {
  const provider = PROVIDERS[name];
  if (!provider) {
    throw new ValidationError(
      PAYOUT_ERROR_MESSAGES.PAYOUT_PROVIDER_NOT_REGISTERED(name),
    );
  }
  return provider;
}
