import type {IExchangeRateProvider} from '../IExchangeRateProvider';
import {
  EXCHANGE_RATE_API_KEY,
  EXCHANGE_RATE_API_URL,
} from '~/config/env';
import {logger} from '~/utils';

/**
 * ExchangeRate-API Provider
 * Fetches exchange rates from ExchangeRate-API (https://www.exchangerate-api.com/)
 */
export class ExchangeRateAPIProvider implements IExchangeRateProvider {
  readonly name = 'exchange_rate_api';

  isAvailable(): boolean {
    return !!(EXCHANGE_RATE_API_URL && EXCHANGE_RATE_API_KEY);
  }

  async getExchangeRate(
    from: 'UYU' | 'USD',
    to: 'UYU' | 'USD',
  ): Promise<number> {
    if (from === to) {
      return 1;
    }

    if (!this.isAvailable()) {
      throw new Error(
        'ExchangeRate-API provider is not configured. Missing EXCHANGE_RATE_API_URL or EXCHANGE_RATE_API_KEY',
      );
    }

    try {
      // Build API URL - supports ExchangeRate-API format
      // Example: https://v6.exchangerate-api.com/v6/{API_KEY}/latest/USD
      const baseUrl = EXCHANGE_RATE_API_URL!.replace(/\/$/, ''); // Remove trailing slash
      const url = `${baseUrl}/latest/${from}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${EXCHANGE_RATE_API_KEY!}`,
          ...(EXCHANGE_RATE_API_KEY!.startsWith('v6/') && {
            // ExchangeRate-API v6 uses API key in path
            // If API key starts with 'v6/', it's already in the URL format
          }),
        },
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Support ExchangeRate-API format: { rates: { UYU: 40.5, USD: 1 } }
      if (data.rates && typeof data.rates[to] === 'number') {
        return data.rates[to];
      }

      // Support alternative format: { conversion_rate: 0.0247 }
      if (typeof data.conversion_rate === 'number') {
        return data.conversion_rate;
      }

      logger.warn('Unexpected API response format', {data});
      throw new Error('Unexpected API response format');
    } catch (error) {
      logger.error('Error fetching exchange rate from ExchangeRate-API', {
        error,
        from,
        to,
      });
      throw error;
    }
  }
}

