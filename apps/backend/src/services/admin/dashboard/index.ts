import {roundOrderAmount, type EventTicketCurrency} from '@revendiste/shared';
import {VAT_RATE} from '~/config/env';
import {AdminDashboardRepository} from '~/repositories/admin-dashboard';
import type {DashboardDateRange} from '~/controllers/admin/dashboard/validation';
import type {
  GetDashboardTicketsResponse,
  GetDashboardRevenueResponse,
  GetDashboardOrdersResponse,
  GetDashboardPayoutsResponse,
  GetDashboardHealthResponse,
  GetDashboardTopEventsResponse,
} from './types';

function parseNum(s: string | null | undefined): number {
  if (s === null || s === undefined) return 0;
  const n = parseFloat(String(s));
  return Number.isFinite(n) ? n : 0;
}

function formatNumericString(n: number): string {
  return String(roundOrderAmount(n));
}

export class AdminDashboardService {
  constructor(private readonly repo: AdminDashboardRepository) {}

  async getTicketsStats(
    range: DashboardDateRange,
  ): Promise<GetDashboardTicketsResponse> {
    return this.repo.getTicketsMetrics(range);
  }

  async getRevenueStats(
    range: DashboardDateRange,
  ): Promise<GetDashboardRevenueResponse> {
    const rows = await this.repo.getRevenueByCurrency(range);

    let gmv = 0;
    let platformCommission = 0;
    let vatOnCommission = 0;
    let processorFees = 0;

    for (const r of rows) {
      gmv += parseNum(r.gmv);
      platformCommission += parseNum(r.platformCommission);
      vatOnCommission += parseNum(r.vatOnCommission);
      processorFees += parseNum(r.processorFees);
    }

    const netPlatformIncome = roundOrderAmount(
      platformCommission + vatOnCommission - processorFees,
    );

    const commissionPlusVat = platformCommission + vatOnCommission;
    let platformIncomeVatAmount = 0;
    let netPlatformIncomeAfterIncomeVat = netPlatformIncome;
    if (netPlatformIncome > 0) {
      platformIncomeVatAmount = roundOrderAmount(
        netPlatformIncome * VAT_RATE,
      );
      netPlatformIncomeAfterIncomeVat = roundOrderAmount(
        netPlatformIncome - platformIncomeVatAmount,
      );
    }

    let processorFeesPercentOfCommissionAndVat = 0;
    let netPlatformIncomePercentOfCommissionAndVat = 0;
    if (commissionPlusVat > 0) {
      processorFeesPercentOfCommissionAndVat = roundOrderAmount(
        (processorFees / commissionPlusVat) * 100,
      );
      netPlatformIncomePercentOfCommissionAndVat = roundOrderAmount(
        (netPlatformIncome / commissionPlusVat) * 100,
      );
    }

    const currency: EventTicketCurrency =
      rows.length === 1
        ? rows[0]!.currency
        : (rows[0]?.currency ?? 'UYU');

    return {
      gmv: formatNumericString(gmv),
      platformCommission: formatNumericString(platformCommission),
      vatOnCommission: formatNumericString(vatOnCommission),
      processorFees: formatNumericString(processorFees),
      netPlatformIncome: formatNumericString(netPlatformIncome),
      platformIncomeVatAmount: formatNumericString(platformIncomeVatAmount),
      netPlatformIncomeAfterIncomeVat: formatNumericString(
        netPlatformIncomeAfterIncomeVat,
      ),
      platformIncomeVatRate: VAT_RATE,
      processorFeesPercentOfCommissionAndVat,
      netPlatformIncomePercentOfCommissionAndVat,
      currency,
      mixedCurrency: rows.length > 1,
    };
  }

  async getOrdersStats(
    range: DashboardDateRange,
  ): Promise<GetDashboardOrdersResponse> {
    const data = await this.repo.getOrdersMetrics(range);

    const {successful, failed, expired} = data.payments;
    const denom = successful + failed + expired;
    const conversionRate =
      denom === 0 ? 0 : roundOrderAmount((successful / denom) * 100);

    return {
      pending: data.orders.pending,
      confirmed: data.orders.confirmed,
      expired: data.orders.expired,
      cancelled: data.orders.cancelled,
      payments: {
        successful,
        failed,
        expired,
        conversionRate,
      },
    };
  }

  async getPayoutsStats(
    range: DashboardDateRange,
  ): Promise<GetDashboardPayoutsResponse> {
    const row = await this.repo.getPayoutsMetrics(range);
    return {
      ...row,
      currency: (row.currency ?? 'UYU') as EventTicketCurrency,
    };
  }

  async getHealthStats(): Promise<GetDashboardHealthResponse> {
    return this.repo.getHealthMetrics();
  }

  async getTopEventsStats(
    range: DashboardDateRange,
  ): Promise<GetDashboardTopEventsResponse> {
    const events = await this.repo.getTopEvents(range);
    return {events};
  }
}
