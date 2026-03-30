import {PostHog} from 'posthog-node';

let posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog {
  if (!posthogClient) {
    posthogClient = new PostHog(
      import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN as string,
      {
        host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string,
        // Long-running SSR server (Nitro) — use default batching.
        // Only set flushAt: 1 / flushInterval: 0 for short-lived processes (serverless, scripts).
      },
    );
  }
  return posthogClient;
}
