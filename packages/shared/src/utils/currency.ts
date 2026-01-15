/**
 * Currency Formatting Utilities - Single Source of Truth
 *
 * This module provides all currency formatting logic for the Revendiste platform.
 * Used by both frontend and backend to ensure consistent formatting.
 *
 * All formatters use es-UY locale and round to 2 decimal places.
 */

import {roundOrderAmount} from './amounts';

// =============================================================================
// TYPES
// =============================================================================

export type CurrencyCode = 'UYU' | 'USD';

// =============================================================================
// CURRENCY SYMBOLS
// =============================================================================

/**
 * Get the currency symbol for display
 *
 * @param currency - Currency code ('UYU' or 'USD')
 * @returns Currency symbol
 *
 * @example
 * getCurrencySymbol('UYU') // '$'
 * getCurrencySymbol('USD') // 'U$S'
 */
export function getCurrencySymbol(currency: CurrencyCode | string): string {
  const normalizedCurrency =
    typeof currency === 'string' ? currency.toUpperCase() : currency;

  switch (normalizedCurrency) {
    case 'USD':
      return 'U$S';
    case 'UYU':
    default:
      return '$';
  }
}

// =============================================================================
// FORMATTING FUNCTIONS
// =============================================================================

/**
 * Format a price with currency symbol (compact format)
 * Output: "$ 1.234,56" or "U$S 1.234,56"
 *
 * Use this for:
 * - Ticket prices in listings
 * - Order summaries
 * - Any price display where space is limited
 *
 * @param amount - The amount to format
 * @param currency - Currency code ('UYU' or 'USD')
 * @returns Formatted price string
 *
 * @example
 * formatPrice(1234.56, 'UYU') // '$ 1.234,56'
 * formatPrice(32.196, 'USD')  // 'U$S 32,20'
 */
export function formatPrice(
  amount: number | string,
  currency: CurrencyCode | string = 'UYU',
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const roundedAmount = roundOrderAmount(numAmount);
  const formatted = roundedAmount.toLocaleString('es-UY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${getCurrencySymbol(currency)} ${formatted}`;
}

/**
 * Format currency amount with currency symbol and code (full format)
 * Output: "$1.234,56 UYU" or "$1.234,56 USD"
 *
 * Use this for:
 * - Payout amounts
 * - Balance displays
 * - Admin interfaces where currency code is important
 *
 * @param amount - The amount to format
 * @param currency - Currency code ('UYU' or 'USD')
 * @returns Formatted currency string with code
 *
 * @example
 * formatCurrency(1234.56, 'UYU') // '$1.234,56 UYU'
 * formatCurrency(32.196, 'USD')  // '$32,20 USD'
 */
export function formatCurrency(
  amount: number | string,
  currency: CurrencyCode | string,
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const roundedAmount = roundOrderAmount(numAmount);
  const formatted = new Intl.NumberFormat('es-UY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundedAmount);

  const normalizedCurrency =
    typeof currency === 'string' ? currency.toUpperCase() : currency;

  if (normalizedCurrency === 'UYU') {
    return `$${formatted} UYU`;
  }
  return `$${formatted} USD`;
}

/**
 * Format a number with 2 decimal places (no currency symbol)
 * Output: "1.234,56"
 *
 * Use this for:
 * - Input field displays
 * - Calculations where you'll add the symbol separately
 *
 * @param amount - The amount to format
 * @returns Formatted number string
 *
 * @example
 * formatAmount(1234.567) // '1.234,57'
 * formatAmount('32.196') // '32,20'
 */
export function formatAmount(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const roundedAmount = roundOrderAmount(numAmount);
  return roundedAmount.toLocaleString('es-UY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
