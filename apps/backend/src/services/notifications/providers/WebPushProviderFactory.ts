import {VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY} from '~/config/env';
import {ConsoleWebPushProvider} from './ConsoleWebPushProvider';
import {WebPushProvider} from './WebPushProvider';
import type {IWebPushProvider} from './IWebPushProvider';

/**
 * Web Push Provider Factory
 *
 * Returns ConsoleWebPushProvider when VAPID keys are not configured,
 * and WebPushProvider when they are.
 */
class WebPushProviderFactory {
  private static instance: IWebPushProvider | null = null;

  static getProvider(): IWebPushProvider {
    if (!this.instance) {
      this.instance = this.createProvider();
    }
    return this.instance;
  }

  private static createProvider(): IWebPushProvider {
    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      return new WebPushProvider();
    }
    return new ConsoleWebPushProvider();
  }

  static reset(): void {
    this.instance = null;
  }
}

export const getWebPushProvider = (): IWebPushProvider => {
  return WebPushProviderFactory.getProvider();
};
