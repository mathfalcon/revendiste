import type {UruguayanBankName} from '../schemas/payout-methods';

/** dLocal Go `bank_code` and currency support for Uruguay payouts */
export interface UruguayanBankInfo {
  bankCode: string;
  displayName: string;
  supportsUyu: boolean;
  supportsUsd: boolean;
}

export const URUGUAYAN_BANK_INFO: Record<UruguayanBankName, UruguayanBankInfo> =
  {
    BROU: {
      bankCode: '001',
      displayName: 'BROU',
      supportsUyu: true,
      supportsUsd: true,
    },
    BHU: {
      bankCode: '091',
      displayName: 'BHU',
      supportsUyu: true,
      supportsUsd: false,
    },
    Scotiabank: {
      bankCode: '128',
      displayName: 'Scotiabank',
      supportsUyu: true,
      supportsUsd: true,
    },
    Itau: {
      bankCode: '113',
      displayName: 'Itaú',
      supportsUyu: true,
      supportsUsd: true,
    },
    Santander: {
      bankCode: '137',
      displayName: 'Santander',
      supportsUyu: true,
      supportsUsd: true,
    },
    BBVA: {
      bankCode: '153',
      displayName: 'BBVA',
      supportsUyu: true,
      supportsUsd: true,
    },
    HSBC: {
      bankCode: '157',
      displayName: 'HSBC',
      supportsUyu: true,
      supportsUsd: true,
    },
    Heritage: {
      bankCode: '162',
      displayName: 'Banque Heritage',
      supportsUyu: true,
      supportsUsd: false,
    },
    Citibank: {
      bankCode: '205',
      displayName: 'Citibank',
      supportsUyu: true,
      supportsUsd: true,
    },
    'Banco Nacion Arg': {
      bankCode: '246',
      displayName: 'Banco de la Nación Argentina',
      supportsUyu: true,
      supportsUsd: false,
    },
    PREX: {
      bankCode: '603',
      displayName: 'Prex',
      supportsUyu: true,
      supportsUsd: true,
    },
    Midinero: {
      bankCode: '917',
      displayName: 'Mi Dinero',
      supportsUyu: true,
      supportsUsd: false,
    },
    'OCA Blue': {
      bankCode: '999',
      displayName: 'Oca Blue',
      supportsUyu: true,
      supportsUsd: true,
    },
  };

/** Stable UI order (matches common bank listing) */
const URUGUAYAN_BANK_ORDER: readonly UruguayanBankName[] = [
  'Banco Nacion Arg',
  'BBVA',
  'BHU',
  'BROU',
  'Citibank',
  'Heritage',
  'HSBC',
  'Itau',
  'Midinero',
  'OCA Blue',
  'PREX',
  'Santander',
  'Scotiabank',
];

export function getBanksForCurrency(
  currency: 'UYU' | 'USD',
): readonly UruguayanBankName[] {
  return URUGUAYAN_BANK_ORDER.filter(name => {
    const info = URUGUAYAN_BANK_INFO[name];
    return currency === 'USD' ? info.supportsUsd : info.supportsUyu;
  });
}
