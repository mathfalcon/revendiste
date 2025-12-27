/**
 * Exchange Rate Provider Interface
 *
 * This interface defines the contract for fetching exchange rates.
 * It allows us to easily swap between different exchange rate sources
 * (ExchangeRate-API, Uruguay's National Bank, etc.) without changing
 * the business logic.
 */

export interface IExchangeRateProvider {
  /**
   * Unique identifier for this provider (e.g., 'exchange_rate_api', 'uruguay_bank')
   */
  readonly name: string;

  /**
   * Get exchange rate from one currency to another
   * @param from Source currency
   * @param to Target currency
   * @returns Exchange rate (multiply source amount by this to get target amount)
   * @throws Error if the provider fails to fetch the rate
   */
  getExchangeRate(
    from: 'UYU' | 'USD',
    to: 'UYU' | 'USD',
  ): Promise<number>;

  /**
   * Check if this provider is available/configured
   * @returns True if provider can be used, false otherwise
   */
  isAvailable(): boolean;
}

