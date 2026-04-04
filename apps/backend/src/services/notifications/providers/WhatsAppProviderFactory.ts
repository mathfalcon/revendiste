import {WHATSAPP_PROVIDER} from '~/config/env';
import {ConsoleWhatsAppProvider} from './ConsoleWhatsAppProvider';
import {WhatsAppBusinessProvider} from './WhatsAppBusinessProvider';
import type {IWhatsAppProvider} from './IWhatsAppProvider';

/**
 * WhatsApp Provider Factory
 *
 * Creates and returns the appropriate WhatsApp provider based on configuration.
 * Follows the same singleton pattern as EmailProviderFactory.
 */
class WhatsAppProviderFactory {
  private static instance: IWhatsAppProvider | null = null;

  static getProvider(): IWhatsAppProvider {
    if (!this.instance) {
      this.instance = this.createProvider();
    }
    return this.instance;
  }

  private static createProvider(): IWhatsAppProvider {
    switch (WHATSAPP_PROVIDER) {
      case 'console':
        return new ConsoleWhatsAppProvider();

      case 'whatsapp_business':
        return new WhatsAppBusinessProvider();

      default:
        return new ConsoleWhatsAppProvider();
    }
  }

  static reset(): void {
    this.instance = null;
  }
}

export const getWhatsAppProvider = (): IWhatsAppProvider => {
  return WhatsAppProviderFactory.getProvider();
};
