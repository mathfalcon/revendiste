import {AsyncLocalStorage} from 'node:async_hooks';

/**
 * Per-request PostHog fields for log → session replay linking.
 * @see https://posthog.com/docs/logs/link-session-replay
 */
export type PosthogRequestLogContext = {
  sessionId?: string;
  posthogDistinctId?: string;
};

const storage = new AsyncLocalStorage<PosthogRequestLogContext>();

export const posthogRequestLogContext = {
  /** Call from Express middleware; propagates to async route handlers. */
  enterWith(ctx: PosthogRequestLogContext): void {
    storage.enterWith(ctx);
  },

  get(): PosthogRequestLogContext | undefined {
    return storage.getStore();
  },
};
