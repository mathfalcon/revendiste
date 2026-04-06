export interface WebPushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface WebPushResult {
  success: boolean;
  /** True when the push service returns 404 or 410 — subscription is expired/invalid */
  stale?: boolean;
  error?: string;
}

/**
 * Web Push Provider Interface
 *
 * Defines the contract for Web Push notification providers.
 * Allows swapping between console (dev) and real web-push (prod).
 */
export interface IWebPushProvider {
  sendPush(
    subscription: WebPushSubscription,
    payload: WebPushPayload,
  ): Promise<WebPushResult>;
}
