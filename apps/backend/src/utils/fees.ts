/**
 * Fee Calculation Utilities - Backend Wrapper
 *
 * This module re-exports fee calculations from @revendiste/shared
 * and binds them to the backend's environment variables.
 */

import {
  calculateOrderFees as sharedCalculateOrderFees,
  calculateSellerAmount as sharedCalculateSellerAmount,
  getFeeRatesDisplay,
  type FeeCalculationResult,
  type SellerAmountResult,
} from '@revendiste/shared';
import {PLATFORM_COMMISSION_RATE, VAT_RATE} from '~/config/env';

// Re-export types
export type {FeeCalculationResult, SellerAmountResult};

// Get the fee rates from environment
const feeRates = {
  platformCommissionRate: PLATFORM_COMMISSION_RATE,
  vatRate: VAT_RATE,
};

/**
 * Calculates platform commission and VAT for ticket orders
 * All amounts are rounded to 2 decimal places for currency precision
 * @param subtotalAmount - The subtotal amount before fees
 * @returns Fee calculation breakdown
 */
export function calculateOrderFees(
  subtotalAmount: number,
): FeeCalculationResult {
  return sharedCalculateOrderFees(subtotalAmount, feeRates);
}

/**
 * Calculates seller amount after platform commission and VAT deductions
 * This is used for seller payouts (opposite of buyer fees)
 * All amounts are rounded to 2 decimal places for currency precision
 * @param sellingPrice - The price the seller is asking for
 * @returns Seller payout breakdown
 */
export function calculateSellerAmount(
  sellingPrice: number,
): FeeCalculationResult {
  const result = sharedCalculateSellerAmount(sellingPrice, feeRates);
  // Return in the format expected by existing backend code
  return {
    subtotalAmount: result.sellingPrice,
    platformCommission: result.platformCommission,
    vatOnCommission: result.vatOnCommission,
    totalAmount: result.sellerAmount,
  };
}

/**
 * Gets the current fee rates for display purposes
 */
export function getFeeRates() {
  return getFeeRatesDisplay(feeRates);
}
