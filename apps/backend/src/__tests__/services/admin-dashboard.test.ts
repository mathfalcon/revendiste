/**
 * AdminDashboardService: revenue stats use issued invoices (buyer + seller), not order columns alone.
 */
import {AdminDashboardService} from '~/services/admin/dashboard';
import type {AdminDashboardRepository} from '~/repositories/admin-dashboard';

describe('AdminDashboardService', () => {
  it('getRevenueStats sums invoice-based platform revenue and merges revenueByParty', async () => {
    const mockRepo = {
      getRevenueByCurrency: jest.fn().mockResolvedValue([
        {
          currency: 'UYU',
          gmv: '1851.27',
          platformRevenue: '207',
          vatOnRevenue: '45.54',
          processorFees: '0',
        },
      ]),
      getRevenuePartyBreakdownSettlement: jest.fn().mockResolvedValue([
        {
          currency: 'UYU',
          party: 'buyer',
          platformRevenue: '103.5',
          vatOnRevenue: '22.77',
        },
        {
          currency: 'UYU',
          party: 'seller',
          platformRevenue: '103.5',
          vatOnRevenue: '22.77',
        },
      ]),
      countOrdersMissingIssuedInvoices: jest.fn().mockResolvedValue(0),
    } as unknown as AdminDashboardRepository;

    const service = new AdminDashboardService(mockRepo);
    const range = {
      from: new Date('2026-04-01'),
      to: new Date('2026-04-30'),
    };

    const result = await service.getRevenueStats(range);

    expect(result.platformRevenue).toBe('207');
    expect(result.vatOnRevenue).toBe('45.54');
    expect(
      parseFloat(result.platformRevenue) + parseFloat(result.vatOnRevenue),
    ).toBeCloseTo(252.54, 2);
    expect(result.revenueByParty.buyer).toEqual({
      base: '103.5',
      vat: '22.77',
    });
    expect(result.revenueByParty.seller).toEqual({
      base: '103.5',
      vat: '22.77',
    });
    expect(result.ordersMissingInvoices).toBe(0);
    expect(result.netPlatformIncome).toBe('252.54');
  });
});
