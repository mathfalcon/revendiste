import {EXCHANGE_RATE_CACHE_TTL_HOURS} from '~/config/env';
import {logger} from '~/utils';
import {roundToDecimals} from '@revendiste/shared';
import {getExchangeRateProvider} from './ExchangeRateProviderFactory';
import type {IExchangeRateProvider} from './IExchangeRateProvider';

interface CachedRate {
  rate: number;
  timestamp: number;
}

/**
 * Exchange rate service for converting between UYU and USD
 * Uses provider pattern to support multiple exchange rate sources
 * (ExchangeRate-API, Uruguay's National Bank, etc.)
 */
export class ExchangeRateService {
  private cache: Map<string, CachedRate> = new Map();
  private readonly cacheTTL: number;
  private readonly provider: IExchangeRateProvider;

  constructor(provider?: IExchangeRateProvider) {
    // Convert hours to milliseconds
    this.cacheTTL = EXCHANGE_RATE_CACHE_TTL_HOURS * 60 * 60 * 1000;
    // Use provided provider or get from factory
    this.provider = provider || getExchangeRateProvider();
  }

  /**
   * Get exchange rate from one currency to another
   * @param from Source currency
   * @param to Target currency
   * @returns Exchange rate (multiply source amount by this to get target amount)
   */
  async getExchangeRate(
    from: 'UYU' | 'USD',
    to: 'UYU' | 'USD',
  ): Promise<number> {
    if (from === to) {
      return 1;
    }

    const cacheKey = `${from}_${to}`;
    const cached = this.cache.get(cacheKey);

    // Check if cached rate is still valid
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      logger.debug(
        `Using cached exchange rate for ${cacheKey}: ${cached.rate} (provider: ${this.provider.name})`,
      );
      return cached.rate;
    }

    try {
      // Fetch rate from provider
      const rate = await this.provider.getExchangeRate(from, to);

      // Cache the rate
      this.cache.set(cacheKey, {
        rate,
        timestamp: Date.now(),
      });

      logger.info(
        `Fetched exchange rate from ${this.provider.name} for ${cacheKey}: ${rate}`,
      );

      return rate;
    } catch (error) {
      logger.error(
        `Failed to fetch exchange rate from ${this.provider.name}, using cached rate if available`,
        {error, from, to},
      );

      // If we have a cached rate (even if expired), use it as fallback
      if (cached) {
        logger.warn(
          `Using expired cached rate for ${cacheKey}: ${cached.rate}`,
        );
        return cached.rate;
      }

      // If no cache and provider fails, rethrow the error
      throw error;
    }
  }

  /**
   * Convert amount from one currency to another
   * @param amount Amount to convert
   * @param from Source currency
   * @param to Target currency
   * @returns Converted amount and exchange rate used
   */
  async convertAmount(
    amount: number,
    from: 'UYU' | 'USD',
    to: 'UYU' | 'USD',
  ): Promise<{convertedAmount: number; exchangeRate: number}> {
    const exchangeRate = await this.getExchangeRate(from, to);
    const convertedAmount = amount * exchangeRate;

    return {
      convertedAmount: roundToDecimals(convertedAmount, 2), // Round to 2 decimal places
      exchangeRate,
    };
  }

  /**
   * Clear the exchange rate cache
   * Useful for testing or forcing a refresh
   */
  clearCache(): void {
    this.cache.clear();
  }
}
