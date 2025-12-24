import {DLocalService} from '~/services/dlocal';
import type {PaymentProvider} from './PaymentProvider.interface';
import type {PaymentProvider as PaymentProviderEnum} from '@revendiste/shared';

/**
 * Factory to get PaymentProvider instances by provider name
 * Centralizes provider instantiation logic
 */
export function getPaymentProvider(
  providerName: PaymentProviderEnum,
): PaymentProvider {
  switch (providerName) {
    case 'dlocal':
      return new DLocalService();
    // Future providers:
    // case 'stripe':
    //   return new StripeService();
    // case 'paypal':
    //   return new PayPalService();
    default:
      throw new Error(`Unknown payment provider: ${providerName}`);
  }
}
