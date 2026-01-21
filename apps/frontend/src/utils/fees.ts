/**
 * Fee Calculation Utilities - Frontend Wrapper
 *
 * This module re-exports fee calculations from @revendiste/shared
 * and binds them to the frontend's environment variables.
 */

import {EventTicketCurrency} from '~/lib';
import {
  calculateOrderFees as sharedCalculateOrderFees,
  calculateSellerAmount as sharedCalculateSellerAmount,
  calculateSellingPriceFromSellerAmount as sharedCalculateSellingPriceFromSellerAmount,
  getFeeRatesDisplay,
  calculateMaxResalePrice,
  type FeeCalculationResult,
  type SellerAmountResult as SharedSellerAmountResult,
} from '@revendiste/shared';

// Re-export pricing utilities
export {calculateMaxResalePrice};
import {VITE_PLATFORM_COMMISSION_RATE, VITE_VAT_RATE} from '~/config/env';

// Re-export types
export type {FeeCalculationResult};

// Frontend-specific seller amount result (includes currency)
export interface SellerAmountResult extends SharedSellerAmountResult {
  currency: EventTicketCurrency;
}

// Get the fee rates from environment
const feeRates = {
  platformCommissionRate: VITE_PLATFORM_COMMISSION_RATE,
  vatRate: VITE_VAT_RATE,
};

/**
 * Calculates platform commission and VAT for ticket orders (buyer perspective)
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
 * Calculates seller amount after platform commission and VAT deductions (seller perspective)
 * All amounts are rounded to 2 decimal places for currency precision
 * @param sellingPrice - The price the seller is asking for
 * @param currency - The currency for the calculation
 * @returns Seller payout breakdown
 */
export function calculateSellerAmount(
  sellingPrice: number,
  currency: EventTicketCurrency = EventTicketCurrency.UYU,
): SellerAmountResult {
  const result = sharedCalculateSellerAmount(sellingPrice, feeRates);
  return {
    ...result,
    currency,
  };
}

/**
 * Gets the current fee rates for display purposes
 */
export function getFeeRates() {
  return getFeeRatesDisplay(feeRates);
}

/**
 * Calculates the selling price needed to receive a desired seller amount (reverse calculation)
 * Used when seller wants to input "what they want to receive" instead of the publishing price
 * @param desiredSellerAmount - The amount the seller wants to receive after fees
 * @returns The selling price that would result in the desired seller amount
 */
export function calculateSellingPriceFromSellerAmount(
  desiredSellerAmount: number,
): number {
  return sharedCalculateSellingPriceFromSellerAmount(desiredSellerAmount, feeRates);
}
