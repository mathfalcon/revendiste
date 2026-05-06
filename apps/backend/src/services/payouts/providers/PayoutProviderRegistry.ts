import type {PayoutType} from '@revendiste/shared';
import {ValidationError} from '~/errors';
import {PAYOUT_ERROR_MESSAGES} from '~/constants/error-messages';
import {ManualBankTransferProvider} from './ManualBankTransferProvider';
import {DLocalGoPayoutProvider} from './DLocalGoPayoutProvider';
import type {
  PayoutProvider,
  PayoutProviderName,
} from './PayoutProvider.interface';

const manualBankProvider = new ManualBankTransferProvider();
const dlocalGoPayoutProvider = new DLocalGoPayoutProvider();

const PROVIDERS: Record<PayoutProviderName, PayoutProvider> = {
  manual_bank: manualBankProvider,
  dlocal_go: dlocalGoPayoutProvider,
};

/**
 * Decides which provider id is stored on `payouts.payout_provider` for a payout method.
 * - Uruguay: `dlocal_go` when the PostHog flag is on, otherwise `manual_bank`.
 * - Argentina: only `dlocal_go` (flag and route validation must block otherwise).
 */
export function resolvePayoutProviderName(input: {
  payoutType: PayoutType;
  dlocalGoEnabled: boolean;
}): PayoutProviderName {
  if (input.payoutType === 'uruguayan_bank') {
    return input.dlocalGoEnabled ? 'dlocal_go' : 'manual_bank';
  }
  if (input.payoutType === 'argentinian_bank') {
    if (!input.dlocalGoEnabled) {
      throw new ValidationError(
        PAYOUT_ERROR_MESSAGES.DLOCAL_GO_PAYOUTS_DISABLED,
      );
    }
    return 'dlocal_go';
  }
  const _e: never = input.payoutType;
  return _e;
}

export function getPayoutProviderByName(
  name: PayoutProviderName,
): PayoutProvider {
  const provider = PROVIDERS[name];
  if (!provider) {
    throw new ValidationError(
      PAYOUT_ERROR_MESSAGES.PAYOUT_PROVIDER_NOT_REGISTERED(String(name)),
    );
  }
  return provider;
}
