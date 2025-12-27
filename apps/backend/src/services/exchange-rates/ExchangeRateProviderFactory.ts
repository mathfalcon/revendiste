import {
  EXCHANGE_RATE_PROVIDER,
  EXCHANGE_RATE_FALLBACK_UYU_TO_USD,
} from '~/config/env';
import {logger} from '~/utils';
import {ExchangeRateAPIProvider} from './providers/ExchangeRateAPIProvider';
import {UruguayBankProvider} from './providers/UruguayBankProvider';
import type {IExchangeRateProvider} from './IExchangeRateProvider';

/**
 * Exchange Rate Provider Factory
 *
 * Creates and returns the appropriate exchange rate provider based on configuration.
 * This allows us to easily switch between different exchange rate sources
 * without changing the application code.
 */
class ExchangeRateProviderFactory {
  private static instance: IExchangeRateProvider | null = null;

  /**
   * Get the exchange rate provider instance (singleton)
   */
  static getProvider(): IExchangeRateProvider {
    if (!this.instance) {
      this.instance = this.createProvider();
    }
    return this.instance;
  }

  /**
   * Create a new exchange rate provider based on configuration
   */
  private static createProvider(): IExchangeRateProvider {
    switch (EXCHANGE_RATE_PROVIDER) {
      case 'exchange_rate_api':
        return this.createExchangeRateAPIProvider();

      case 'uruguay_bank':
        return this.createUruguayBankProvider();

      case 'fallback':
        return this.createFallbackProvider();

      default:
        // Default to ExchangeRate-API if available, otherwise fallback
        const apiProvider = new ExchangeRateAPIProvider();
        if (apiProvider.isAvailable()) {
          logger.info('Using ExchangeRate-API provider (default)');
          return apiProvider;
        }
        logger.warn(
          'ExchangeRate-API not available, falling back to configured fallback rate',
        );
        return this.createFallbackProvider();
    }
  }

  /**
   * Create ExchangeRate-API provider
   */
  private static createExchangeRateAPIProvider(): ExchangeRateAPIProvider {
    const provider = new ExchangeRateAPIProvider();
    if (!provider.isAvailable()) {
      throw new Error(
        'ExchangeRate-API provider is not configured. Set EXCHANGE_RATE_API_URL and EXCHANGE_RATE_API_KEY, or use EXCHANGE_RATE_PROVIDER=fallback',
      );
    }
    return provider;
  }

  /**
   * Create Uruguay Bank provider
   */
  private static createUruguayBankProvider(): UruguayBankProvider {
    const provider = new UruguayBankProvider();
    if (!provider.isAvailable()) {
      throw new Error(
        'Uruguay Bank provider is not yet implemented or not configured',
      );
    }
    return provider;
  }

  /**
   * Create fallback provider (uses configured fallback rate)
   */
  private static createFallbackProvider(): IExchangeRateProvider {
    return {
      name: 'fallback',
      isAvailable: () => true,
      getExchangeRate: async (from: 'UYU' | 'USD', to: 'UYU' | 'USD') => {
        if (from === to) {
          return 1;
        }
        if (from === 'UYU' && to === 'USD') {
          return EXCHANGE_RATE_FALLBACK_UYU_TO_USD;
        }
        if (from === 'USD' && to === 'UYU') {
          return 1 / EXCHANGE_RATE_FALLBACK_UYU_TO_USD;
        }
        return 1;
      },
    };
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}

// Export a convenient function to get the exchange rate provider
export const getExchangeRateProvider = (): IExchangeRateProvider => {
  return ExchangeRateProviderFactory.getProvider();
};

