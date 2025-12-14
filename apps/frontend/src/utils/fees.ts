import {EventTicketCurrency} from '~/lib';
import {VITE_PLATFORM_COMMISSION_RATE, VITE_VAT_RATE} from '~/config/env';

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
  currency: EventTicketCurrency;
}

/**
 * Calculates platform commission and VAT for ticket orders (buyer perspective)
 * @param subtotalAmount - The subtotal amount before fees
 * @returns Fee calculation breakdown
 */
export function calculateOrderFees(
  subtotalAmount: number,
): FeeCalculationResult {
  const platformCommission = subtotalAmount * VITE_PLATFORM_COMMISSION_RATE;
  const vatOnCommission = platformCommission * VITE_VAT_RATE;
  const totalAmount = subtotalAmount + platformCommission + vatOnCommission;

  return {
    subtotalAmount,
    platformCommission,
    vatOnCommission,
    totalAmount,
  };
}

/**
 * Calculates seller amount after platform commission and VAT deductions (seller perspective)
 * @param sellingPrice - The price the seller is asking for
 * @param currency - The currency for the calculation
 * @returns Seller payout breakdown
 */
export function calculateSellerAmount(
  sellingPrice: number,
  currency: EventTicketCurrency = EventTicketCurrency.UYU,
): SellerAmountResult {
  const platformCommission = sellingPrice * VITE_PLATFORM_COMMISSION_RATE;
  const vatOnCommission = platformCommission * VITE_VAT_RATE;
  const totalDeductions = platformCommission + vatOnCommission;
  const sellerAmount = sellingPrice - totalDeductions;

  return {
    sellingPrice,
    platformCommission,
    vatOnCommission,
    totalDeductions,
    sellerAmount,
    currency,
  };
}

/**
 * Gets the current fee rates for display purposes
 */
export function getFeeRates() {
  return {
    platformCommissionRate: VITE_PLATFORM_COMMISSION_RATE,
    vatRate: VITE_VAT_RATE,
    platformCommissionPercentage: Math.round(
      VITE_PLATFORM_COMMISSION_RATE * 100,
    ),
    vatPercentage: Math.round(VITE_VAT_RATE * 100),
  };
}
