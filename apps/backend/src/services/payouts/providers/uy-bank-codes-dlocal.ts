import type {UruguayanBankName} from '@revendiste/shared';

/**
 * 3-digit codes for dLocal Payouts v3 `bank_account.code` in Uruguay.
 * @see dLocal “Country requirements (Uruguay)” in Payouts v3.
 */
const UY_TO_DLOCAL_BANK_CODE: Partial<Record<UruguayanBankName, string>> = {
  'Banco Nacion Arg': '10',
  BBVA: '9',
  BHU: '4',
  BROU: '1',
  Citibank: '2',
  Heritage: '5',
  HSBC: '6',
  Itau: '3',
  Midinero: '13',
  'OCA Blue': '11',
  PREX: '12',
  Santander: '7',
  Scotiabank: '8',
};

/**
 * Banco de la Nación / Midinero / OCA: prefer explicit mapping; fallback keeps API feedback visible.
 */
export function mapUruguayanBankNameToDLocalCode(
  bankName: UruguayanBankName,
): string {
  return UY_TO_DLOCAL_BANK_CODE[bankName] ?? '0';
}
