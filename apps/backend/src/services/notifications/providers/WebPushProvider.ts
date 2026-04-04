import webpush from 'web-push';
import {VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT} from '~/config/env';
import {logger} from '~/utils';
import type {
  IWebPushProvider,
  WebPushPayload,
  WebPushResult,
  WebPushSubscription,
} from './IWebPushProvider';

/**
 * Web Push Provider
 *
 * Production provider using the web-push library with VAPID keys.
 */
export class WebPushProvider implements IWebPushProvider {
  constructor() {
    webpush.setVapidDetails(
      VAPID_SUBJECT!,
      VAPID_PUBLIC_KEY!,
      VAPID_PRIVATE_KEY!,
    );
  }

  async sendPush(
    subscription: WebPushSubscription,
    payload: WebPushPayload,
  ): Promise<WebPushResult> {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
        JSON.stringify(payload),
        {TTL: 60 * 60}, // 1 hour TTL
      );
      return {success: true};
    } catch (error: any) {
      const statusCode = error?.statusCode;

      // 404 or 410 = subscription expired/invalid
      if (statusCode === 404 || statusCode === 410) {
        logger.info('Web push subscription expired', {
          endpoint: subscription.endpoint.slice(0, 60),
          statusCode,
        });
        return {success: false, stale: true, error: `HTTP ${statusCode}`};
      }

      logger.error('Web push send failed', {
        endpoint: subscription.endpoint.slice(0, 60),
        statusCode,
        error: error?.message,
      });
      return {success: false, error: error?.message};
    }
  }
}
