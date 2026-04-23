/**
 * Subset of BCRA bank codes (first 3 digits of CBU) for AR payout UI.
 * Add entries as the product onboards new banks; keep in sync with dLocal coverage.
 */
export const ARGENTINIAN_BANKS = [
  {code: '000', name: 'Alias (sin banco fijo)'},
  {code: '007', name: 'Banco Galicia'},
  {code: '011', name: 'Banco Nación'},
  {code: '014', name: 'Bancor'},
  {code: '015', name: 'ICBC'},
  {code: '017', name: 'BBVA'},
  {code: '020', name: 'Bancor Córdoba'},
  {code: '027', name: 'Banco Supervielle'},
  {code: '034', name: 'Banco Patagonia'},
  {code: '044', name: 'Banco Hipotecario'},
  {code: '045', name: 'Banco San Juan'},
  {code: '060', name: 'Bancor (alternativo)'},
  {code: '072', name: 'Banco Santander Río'},
  {code: '150', name: 'HSBC'},
  {code: '191', name: 'Banco Credicoop'},
  {code: '198', name: 'BCI'},
  {code: '249', name: 'Brubank'},
  {code: '255', name: 'Ualá (Wilobank)'},
] as const satisfies ReadonlyArray<{code: string; name: string}>;

function normalizeArgentinianBankCodeForLookup(code: string) {
  return String(code).padStart(3, '0').slice(-3);
}

export function getArgentinianBanks() {
  return ARGENTINIAN_BANKS;
}

export function getArgentinianBankNameByCode(bankCode: string) {
  const c = normalizeArgentinianBankCodeForLookup(bankCode);
  const found = ARGENTINIAN_BANKS.find(b => b.code === c);
  return found?.name ?? (c === '000' ? 'Alias' : `Banco (${c})`);
}
