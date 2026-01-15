import type {PaymentProvider} from '../types/db';

/**
 * Human-readable display names for payment providers
 */
export const PAYMENT_PROVIDER_DISPLAY_NAMES: Record<PaymentProvider, string> = {
  dlocal: 'dLocal',
  mercadopago: 'Mercado Pago',
  paypal: 'PayPal',
  stripe: 'Stripe',
};

/**
 * Get the display name for a payment provider
 * @param provider - The payment provider code
 * @returns The human-readable display name
 */
export function getPaymentProviderDisplayName(
  provider: PaymentProvider | string,
): string {
  return (
    PAYMENT_PROVIDER_DISPLAY_NAMES[provider as PaymentProvider] || provider
  );
}

/**
 * Format a list of providers into a human-readable string
 * @param providers - Array of provider codes
 * @returns Formatted string (e.g., "dLocal", "dLocal y Mercado Pago", "dLocal, Stripe y PayPal")
 */
export function formatProvidersList(providers: string[]): string {
  if (providers.length === 0) {
    return '';
  }

  const displayNames = providers.map(p => getPaymentProviderDisplayName(p));

  if (displayNames.length === 1) {
    return displayNames[0]!;
  }

  if (displayNames.length === 2) {
    return `${displayNames[0]} y ${displayNames[1]}`;
  }

  const lastProvider = displayNames.pop();
  return `${displayNames.join(', ')} y ${lastProvider}`;
}
