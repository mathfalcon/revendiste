import posthog from 'posthog-js';
import type {AnalyticsEvent} from './events';
import type {DataLayerEvent} from './types';

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
  }
}

let currentUserId: string | null = null;

function ensureDataLayer(): DataLayerEvent[] | null {
  if (typeof window === 'undefined') return null;
  window.dataLayer = window.dataLayer ?? [];
  return window.dataLayer;
}

/** Sync Clerk user id into GTM dataLayer (and module cache for subsequent events). */
export function setAnalyticsUser(userId: string | null): void {
  currentUserId = userId;
  const dl = ensureDataLayer();
  if (!dl) return;
  const event_id = crypto.randomUUID();
  dl.push({
    event: 'set_user',
    event_id,
    user_id: userId,
    timestamp: new Date().toISOString(),
  });
}

export function trackEvent(
  event: AnalyticsEvent,
  props?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return;
  const dl = ensureDataLayer();
  if (!dl) return;
  const dedupeEventId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const {event_id: domainEventId, ...restProps} = props ?? {};
  // `event_id` in dataLayer is always the dedupe UUID for Meta/GTM; domain event UUIDs go to `content_event_id`.
  const payload: DataLayerEvent = {
    event,
    timestamp,
    ...(currentUserId != null ? {user_id: currentUserId} : {}),
    ...restProps,
    ...(domainEventId !== undefined && domainEventId !== null
      ? {content_event_id: domainEventId}
      : {}),
    event_id: dedupeEventId,
  };
  // TODO(capi): forward dedupeEventId + payload to a backend Conversions API proxy when CAPI ships.
  dl.push(payload);
  posthog.capture(event, {...props, $insert_id: dedupeEventId});
}

/** SPA virtual pageviews for GTM only (PostHog uses built-in pageview capture). */
export function trackPageView(path: string, title?: string): void {
  if (typeof window === 'undefined') return;
  const dl = ensureDataLayer();
  if (!dl) return;
  const event_id = crypto.randomUUID();
  dl.push({
    event: 'page_view',
    event_id,
    page_path: path,
    page_title: title,
    timestamp: new Date().toISOString(),
    ...(currentUserId != null ? {user_id: currentUserId} : {}),
  });
}
