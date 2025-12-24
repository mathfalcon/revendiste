/**
 * Rounds an order/payment amount to the nearest integer
 * Used for payment providers that require integer amounts (e.g., dLocal)
 *
 * @param amount - The amount to round (can be string or number)
 * @returns The rounded amount as an integer
 *
 * @example
 * roundOrderAmount(1277.108) // 1277
 * roundOrderAmount("1277.108") // 1277
 * roundOrderAmount(1277.5) // 1278
 */
export function roundOrderAmount(amount: string | number): number {
  return Math.round(Number(amount));
}

/**
 * Rounds an amount to a specific number of decimal places
 * Useful for currency conversions or display purposes
 *
 * @param amount - The amount to round (can be string or number)
 * @param decimals - Number of decimal places (default: 2)
 * @returns The rounded amount
 *
 * @example
 * roundToDecimals(1277.108, 2) // 1277.11
 * roundToDecimals("1277.108", 0) // 1277
 * roundToDecimals(1277.555, 2) // 1277.56
 */
export function roundToDecimals(
  amount: string | number,
  decimals: number = 2,
): number {
  const factor = Math.pow(10, decimals);
  return Math.round(Number(amount) * factor) / factor;
}

/**
 * Compares two amounts with rounding to handle floating point precision issues
 * Used for validating payment amounts match order amounts
 *
 * @param amount1 - First amount to compare
 * @param amount2 - Second amount to compare
 * @returns true if amounts match after rounding, false otherwise
 *
 * @example
 * compareAmounts(1277, "1277.108") // true (both round to 1277)
 * compareAmounts(1277.5, 1277.4) // false
 */
export function compareAmounts(
  amount1: string | number,
  amount2: string | number,
): boolean {
  return roundOrderAmount(amount1) === roundOrderAmount(amount2);
}
