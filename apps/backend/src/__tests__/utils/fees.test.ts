/**
 * Fee calculation tests using shared package with explicit rates.
 * Tests the same math the backend uses (backend passes env rates to these functions).
 */
import {
  calculateOrderFees,
  calculateSellerAmount,
  calculateSellingPriceFromSellerAmount,
  type FeeRates,
} from '@revendiste/shared';

const RATES_6_22: FeeRates = {
  platformCommissionRate: 0.06,
  vatRate: 0.22,
};

describe('Fee calculations (shared package)', () => {
  describe('calculateOrderFees', () => {
    it.each([
      [100, 100, 6, 1.32, 107.32],
      [0, 0, 0, 0, 0],
      [50.5, 50.5, 3.03, 0.67, 54.2],
    ])(
      'given subtotal %p returns subtotal=%p commission=%p vat=%p total=%p',
      (subtotal, expSubtotal, expCommission, expVat, expTotal) => {
        const result = calculateOrderFees(subtotal, RATES_6_22);
        expect(result.subtotalAmount).toBe(expSubtotal);
        expect(result.platformCommission).toBe(expCommission);
        expect(result.vatOnCommission).toBeCloseTo(expVat, 2);
        expect(result.totalAmount).toBeCloseTo(expTotal, 2);
      },
    );

    it('rounds to 2 decimal places', () => {
      const result = calculateOrderFees(33.33, RATES_6_22);
      expect(result.totalAmount).toBeCloseTo(35.77, 2);
    });
  });

  describe('calculateSellerAmount', () => {
    it.each([
      [100, 100, 6, 1.32, 92.68],
      [50, 50, 3, 0.66, 46.34],
    ])(
      'given price %p returns sellingPrice=%p commission=%p vat=%p sellerAmount=%p',
      (price, expPrice, expCommission, expVat, expSeller) => {
        const result = calculateSellerAmount(price, RATES_6_22);
        expect(result.sellingPrice).toBe(expPrice);
        expect(result.platformCommission).toBe(expCommission);
        expect(result.vatOnCommission).toBeCloseTo(expVat, 2);
        expect(result.sellerAmount).toBeCloseTo(expSeller, 2);
      },
    );

    it('buyer total and seller amount are consistent for same price', () => {
      const subtotal = 100;
      const orderFees = calculateOrderFees(subtotal, RATES_6_22);
      const sellerResult = calculateSellerAmount(subtotal, RATES_6_22);
      expect(orderFees.totalAmount).toBeCloseTo(
        subtotal + orderFees.platformCommission + orderFees.vatOnCommission,
        2,
      );
      expect(sellerResult.sellerAmount).toBeCloseTo(
        subtotal - sellerResult.platformCommission - sellerResult.vatOnCommission,
        2,
      );
      expect(orderFees.platformCommission).toBe(sellerResult.platformCommission);
      expect(orderFees.vatOnCommission).toBe(sellerResult.vatOnCommission);
    });
  });

  describe('calculateSellingPriceFromSellerAmount', () => {
    it('returns selling price that yields desired seller amount', () => {
      const desiredSeller = 92.68;
      const sellingPrice =
        calculateSellingPriceFromSellerAmount(desiredSeller, RATES_6_22);
      expect(sellingPrice).toBeCloseTo(100, 1);
      const back = calculateSellerAmount(sellingPrice, RATES_6_22);
      expect(back.sellerAmount).toBeCloseTo(desiredSeller, 2);
    });
  });
});
