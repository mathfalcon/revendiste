/**
 * Fee Calculation Utilities - Single Source of Truth
 *
 * This module provides all fee calculation logic for the Revendiste platform.
 * Used by both frontend and backend to ensure consistent calculations.
 *
 * IMPORTANT: Fee rates (PLATFORM_COMMISSION_RATE, VAT_RATE) must be passed in
 * since they come from environment variables which differ between frontend/backend.
 */

import {roundOrderAmount} from './amounts';

// =============================================================================
// TYPES
// =============================================================================

export interface FeeCalculationResult {
  subtotalAmount: number;
  platformCommission: number;
  vatOnCommission: number;
  totalAmount: number;
}

export interface SellerAmountResult {
  sellingPrice: number;
  platformCommission: number;
  vatOnCommission: number;
  totalDeductions: number;
  sellerAmount: number;
}

export interface FeeRates {
  platformCommissionRate: number;
  vatRate: number;
}

// =============================================================================
// FEE CALCULATIONS
// =============================================================================

/**
 * Calculates platform commission and VAT for ticket orders (buyer perspective)
 * All amounts are rounded to 2 decimal places for currency precision
 *
 * @param subtotalAmount - The subtotal amount before fees
 * @param rates - Fee rates (platformCommissionRate, vatRate)
 * @returns Fee calculation breakdown
 *
 * @example
 * // With 6% commission and 22% VAT
 * calculateOrderFees(100, { platformCommissionRate: 0.06, vatRate: 0.22 })
 * // Returns: { subtotalAmount: 100, platformCommission: 6, vatOnCommission: 1.32, totalAmount: 107.32 }
 */
export function calculateOrderFees(
  subtotalAmount: number,
  rates: FeeRates,
): FeeCalculationResult {
  const roundedSubtotal = roundOrderAmount(subtotalAmount);
  const platformCommission = roundOrderAmount(
    roundedSubtotal * rates.platformCommissionRate,
  );
  const vatOnCommission = roundOrderAmount(platformCommission * rates.vatRate);
  const totalAmount = roundOrderAmount(
    roundedSubtotal + platformCommission + vatOnCommission,
  );

  return {
    subtotalAmount: roundedSubtotal,
    platformCommission,
    vatOnCommission,
    totalAmount,
  };
}

/**
 * Calculates seller amount after platform commission and VAT deductions (seller perspective)
 * All amounts are rounded to 2 decimal places for currency precision
 *
 * @param sellingPrice - The price the seller is asking for
 * @param rates - Fee rates (platformCommissionRate, vatRate)
 * @returns Seller payout breakdown
 *
 * @example
 * // With 6% commission and 22% VAT
 * calculateSellerAmount(100, { platformCommissionRate: 0.06, vatRate: 0.22 })
 * // Returns: { sellingPrice: 100, platformCommission: 6, vatOnCommission: 1.32, totalDeductions: 7.32, sellerAmount: 92.68 }
 */
export function calculateSellerAmount(
  sellingPrice: number,
  rates: FeeRates,
): SellerAmountResult {
  const roundedPrice = roundOrderAmount(sellingPrice);
  const platformCommission = roundOrderAmount(
    roundedPrice * rates.platformCommissionRate,
  );
  const vatOnCommission = roundOrderAmount(platformCommission * rates.vatRate);
  const totalDeductions = roundOrderAmount(platformCommission + vatOnCommission);
  const sellerAmount = roundOrderAmount(roundedPrice - totalDeductions);

  return {
    sellingPrice: roundedPrice,
    platformCommission,
    vatOnCommission,
    totalDeductions,
    sellerAmount,
  };
}

/**
 * Gets the fee rates as percentages for display purposes
 *
 * @param rates - Fee rates (platformCommissionRate, vatRate)
 * @returns Fee rates with percentage values
 */
export function getFeeRatesDisplay(rates: FeeRates) {
  return {
    platformCommissionRate: rates.platformCommissionRate,
    vatRate: rates.vatRate,
    platformCommissionPercentage: Math.round(rates.platformCommissionRate * 100),
    vatPercentage: Math.round(rates.vatRate * 100),
  };
}
