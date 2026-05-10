import posthog from 'posthog-js';
import {getApiBaseURL} from '~/lib/api';
import {VITE_APP_ENV} from '~/config/env';
import type {AnalyticsEvent} from './events';
import {META_EVENT_MAP} from './events';
import type {DataLayerEvent} from './types';

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
  }
}

let currentUserId: string | null = null;
let utmCaptured = false;

/** Persist first-touch UTMs for attribution (PostHog + optional server-side CAPI/TikTok). */
function captureUtmsOnce(): void {
  if (typeof window === 'undefined' || utmCaptured) return;
  utmCaptured = true;
  const params = new URLSearchParams(window.location.search);
  const keys = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
  ] as const;
  const utm: Record<string, string> = {};
  for (const k of keys) {
    const v = params.get(k);
    if (v) {
      utm[k] = v;
    }
  }
  if (Object.keys(utm).length > 0) {
    try {
      sessionStorage.setItem('marketing_utm', JSON.stringify(utm));
    } catch {
      /* quota / private mode */
    }
    posthog.register(utm);
  }
}

const TIKTOK_EVENT_MAP: Partial<Record<AnalyticsEvent, string>> = {
  checkout_completed: 'CompletePayment',
  checkout_payment_initiated: 'InitiateCheckout',
  event_page_viewed: 'ViewContent',
};

async function forwardMarketingServerEvents(input: {
  metaEventName: 'Purchase' | 'InitiateCheckout' | 'ViewContent';
  tiktokEventName: string;
  eventId: string;
  props?: Record<string, unknown>;
}): Promise<void> {
  if (VITE_APP_ENV === 'local') {
    return;
  }
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const p = input.props;
  const value =
    typeof p?.value === 'number'
      ? p.value
      : typeof p?.amountCents === 'number'
        ? p.amountCents / 100
        : undefined;
  const currency = typeof p?.currency === 'string' ? p.currency : undefined;

  const base = getApiBaseURL();
  const metaBody = {
    eventName: input.metaEventName,
    eventId: input.eventId,
    eventSourceUrl: url,
    ...(value != null ? {value, currency: currency ?? 'UYU'} : {}),
  };

  try {
    await fetch(`${base}/marketing/tracking/meta-capi`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify(metaBody),
    });
  } catch {
    /* non-blocking */
  }

  try {
    await fetch(`${base}/marketing/tracking/tiktok-events`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify({
        event: input.tiktokEventName,
        eventId: input.eventId,
        eventSourceUrl: url,
        ...(value != null ? {value, currency: currency ?? 'UYU'} : {}),
      }),
    });
  } catch {
    /* non-blocking */
  }
}

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
  captureUtmsOnce();
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
  dl.push(payload);
  posthog.capture(event, {...props, $insert_id: dedupeEventId});

  const metaName = META_EVENT_MAP[event];
  const tiktokName = TIKTOK_EVENT_MAP[event];
  if (
    metaName &&
    tiktokName &&
    (metaName === 'Purchase' ||
      metaName === 'InitiateCheckout' ||
      metaName === 'ViewContent')
  ) {
    void forwardMarketingServerEvents({
      metaEventName: metaName,
      tiktokEventName: tiktokName,
      eventId: dedupeEventId,
      props,
    });
  }
}

/** SPA virtual pageviews for GTM only (PostHog uses built-in pageview capture). */
export function trackPageView(path: string, title?: string): void {
  if (typeof window === 'undefined') return;
  captureUtmsOnce();
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
