import {PLATFORM_COMMISSION_RATE, VAT_RATE} from '~/config/env';

export interface FeeCalculationResult {
  subtotalAmount: number;
  platformCommission: number;
  vatOnCommission: number;
  totalAmount: number;
}

/**
 * Calculates platform commission and VAT for ticket orders
 * @param subtotalAmount - The subtotal amount before fees
 * @returns Fee calculation breakdown
 */
export function calculateOrderFees(
  subtotalAmount: number,
): FeeCalculationResult {
  const platformCommission = subtotalAmount * PLATFORM_COMMISSION_RATE;
  const vatOnCommission = platformCommission * VAT_RATE;
  const totalAmount = subtotalAmount + platformCommission + vatOnCommission;

  return {
    subtotalAmount,
    platformCommission,
    vatOnCommission,
    totalAmount,
  };
}

/**
 * Calculates seller amount after platform commission and VAT deductions
 * This is used for seller payouts (opposite of buyer fees)
 * @param sellingPrice - The price the seller is asking for
 * @returns Seller payout breakdown
 */
export function calculateSellerAmount(
  sellingPrice: number,
): FeeCalculationResult {
  const platformCommission = sellingPrice * PLATFORM_COMMISSION_RATE;
  const vatOnCommission = platformCommission * VAT_RATE;
  const totalDeductions = platformCommission + vatOnCommission;
  const amountSellerReceives = sellingPrice - totalDeductions;

  return {
    subtotalAmount: sellingPrice,
    platformCommission,
    vatOnCommission,
    totalAmount: amountSellerReceives,
  };
}

/**
 * Gets the current fee rates for display purposes
 */
export function getFeeRates() {
  return {
    platformCommissionRate: PLATFORM_COMMISSION_RATE,
    vatRate: VAT_RATE,
    platformCommissionPercentage: Math.round(PLATFORM_COMMISSION_RATE * 100),
    vatPercentage: Math.round(VAT_RATE * 100),
  };
}
