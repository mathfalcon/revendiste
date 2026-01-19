/**
 * Rounds an order/payment amount to 2 decimal places
 * Used for payment providers and ensuring consistent currency precision
 *
 * @param amount - The amount to round (can be string or number)
 * @returns The rounded amount with 2 decimal places
 *
 * @example
 * roundOrderAmount(1277.108) // 1277.11
 * roundOrderAmount("32.196") // 32.20
 * roundOrderAmount(1073.205) // 1073.21
 */
export function roundOrderAmount(amount: string | number): number {
  return Math.round(Number(amount) * 100) / 100;
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
 * Compares with 2 decimal place precision
 *
 * @param amount1 - First amount to compare
 * @param amount2 - Second amount to compare
 * @returns true if amounts match after rounding to 2 decimals, false otherwise
 *
 * @example
 * compareAmounts(1277.11, "1277.108") // true (both round to 1277.11)
 * compareAmounts(32.20, 32.196) // true (both round to 32.20)
 * compareAmounts(1277.50, 1277.40) // false
 */
export function compareAmounts(
  amount1: string | number,
  amount2: string | number,
): boolean {
  return roundOrderAmount(amount1) === roundOrderAmount(amount2);
}
