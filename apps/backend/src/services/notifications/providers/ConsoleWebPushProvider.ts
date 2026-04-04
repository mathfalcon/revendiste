import {logger} from '~/utils';
import type {
  IWebPushProvider,
  WebPushPayload,
  WebPushResult,
  WebPushSubscription,
} from './IWebPushProvider';

/**
 * Console Web Push Provider
 *
 * Development/testing provider that logs push payloads to console.
 */
export class ConsoleWebPushProvider implements IWebPushProvider {
  async sendPush(
    subscription: WebPushSubscription,
    payload: WebPushPayload,
  ): Promise<WebPushResult> {
    logger.info('🔔 Web Push would be sent:', {
      endpoint: subscription.endpoint.slice(0, 60) + '...',
      title: payload.title,
      body: payload.body,
      url: payload.url,
      tag: payload.tag,
    });

    return {success: true};
  }
}
