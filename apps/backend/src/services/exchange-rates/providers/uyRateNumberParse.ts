/** Parse Uruguayan bank-style numbers: thousands dots, comma as decimal */
export function parseUyRateNumber(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed === '-' || trimmed === '') {
    return NaN;
  }
  const normalized = trimmed.replace(/\./g, '').replace(',', '.');
  return parseFloat(normalized);
}
