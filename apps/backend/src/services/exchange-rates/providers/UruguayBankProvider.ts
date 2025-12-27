import type {IExchangeRateProvider} from '../IExchangeRateProvider';
import {logger} from '~/utils';

/**
 * Uruguay National Bank Provider
 * Fetches exchange rates from Banco Central del Uruguay (BCU)
 * 
 * TODO: Implement scraping/fetching from BCU website or API
 * Reference: https://www.bcu.gub.uy/ (Banco Central del Uruguay)
 */
export class UruguayBankProvider implements IExchangeRateProvider {
  readonly name = 'uruguay_bank';

  isAvailable(): boolean {
    // TODO: Add configuration check when implementing
    // For now, return false as it's not yet implemented
    return false;
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
        'Uruguay Bank provider is not yet implemented or not configured',
      );
    }

    // TODO: Implement fetching from BCU
    // This could involve:
    // 1. Scraping the BCU website for daily exchange rates
    // 2. Using BCU's API if available
    // 3. Parsing the official exchange rate data

    logger.info('Fetching exchange rate from Uruguay National Bank', {
      from,
      to,
    });

    throw new Error('Uruguay Bank provider is not yet implemented');
  }
}

