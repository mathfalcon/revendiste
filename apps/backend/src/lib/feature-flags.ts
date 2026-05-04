import {getPostHog} from '~/lib/posthog';

export const DLOCAL_GO_PAYOUTS_FLAG_KEY = 'dlocal_go_payouts_enabled';

/**
 * PostHog feature flag for dLocal Go (Payouts v3) and Argentina methods.
 * When PostHog is not configured or the call fails, returns `false` (fail closed).
 */
export async function isDLocalGoPayoutsEnabled(
  userId: string,
): Promise<boolean> {
  const ph = getPostHog();
  if (!ph) {
    return false;
  }
  try {
    const on = await ph.isFeatureEnabled(DLOCAL_GO_PAYOUTS_FLAG_KEY, userId, {
      sendFeatureFlagEvents: false,
    });
    return on === true;
  } catch {
    return false;
  }
}
