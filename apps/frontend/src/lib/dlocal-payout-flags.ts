import {usePostHog} from 'posthog-js/react';

/** PostHog key: enable Argentina + dLocal Go path (server must validate too). */
export const DLOCAL_GO_PAYOUTS_FLAG = 'dlocal_go_payouts_enabled';

/**
 * dLocal Payouts v3 + Argentina. When `false` (or PostHog not loaded), UI only offers Uruguay.
 * Fail closed: treat unknown / loading the same as disabled for bank-country expansion.
 */
export function useDlocalGoPayoutsEnabled(): boolean {
  const ph = usePostHog();
  if (!ph) {
    return false;
  }
  return ph.isFeatureEnabled(DLOCAL_GO_PAYOUTS_FLAG) === true;
}
