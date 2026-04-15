import {UruguayBankProvider} from './providers/UruguayBankProvider';
import type {IExchangeRateProvider} from './IExchangeRateProvider';

class ExchangeRateProviderFactory {
  private static instance: IExchangeRateProvider | null = null;

  static getProvider(): IExchangeRateProvider {
    if (!this.instance) {
      this.instance = new UruguayBankProvider();
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }
}

export const getExchangeRateProvider = (): IExchangeRateProvider =>
  ExchangeRateProviderFactory.getProvider();
