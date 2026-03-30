import {PostHog} from 'posthog-node';
import {POSTHOG_KEY, POSTHOG_HOST} from '~/config/env';

let _posthog: PostHog | null = null;

export function getPostHog(): PostHog | null {
  if (!POSTHOG_KEY) return null;
  if (!_posthog) {
    _posthog = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      enableExceptionAutocapture: true,
    });
  }
  return _posthog;
}

export async function shutdownPostHog(): Promise<void> {
  if (_posthog) {
    await _posthog.shutdown();
  }
}
