import {roundOrderAmount, type EventTicketCurrency} from '@revendiste/shared';
import {VAT_RATE} from '~/config/env';
import {AdminDashboardRepository} from '~/repositories/admin-dashboard';
import {
  type DashboardDateRange,
  resolveDashboardTimeSeriesRange,
} from '~/controllers/admin/dashboard/validation';
import type {
  GetDashboardTicketsResponse,
  GetDashboardRevenueResponse,
  GetDashboardOrdersResponse,
  GetDashboardPayoutsResponse,
  GetDashboardHealthResponse,
  GetDashboardTopEventsResponse,
  GetDashboardRevenueTimeSeriesResponse,
  GetDashboardOrdersTimeSeriesResponse,
  GetDashboardTicketsTimeSeriesResponse,
  GetDashboardRevenueByOrderCurrencyResponse,
} from './types';

function parseNum(s: string | null | undefined): number {
  if (s === null || s === undefined) return 0;
  const n = parseFloat(String(s));
  return Number.isFinite(n) ? n : 0;
}

function formatNumericString(n: number): string {
  return String(roundOrderAmount(n));
}

function toIsoDateOnly(d: Date | string): string {
  if (typeof d === 'string') {
    return d.slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}

/** Label for API: processor settlement currency (`payments.balance_currency`), not order charge currency. */
function settlementCurrencyFromRevenueRows(
  rows: {currency: string | null}[],
): EventTicketCurrency {
  const raw =
    rows.length === 1
      ? rows[0]!.currency
      : (rows[0]?.currency ?? 'UYU');
  return (raw ?? 'UYU') as EventTicketCurrency;
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

    const currency = settlementCurrencyFromRevenueRows(rows);

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

  async getRevenueTimeSeries(
    range: DashboardDateRange,
  ): Promise<GetDashboardRevenueTimeSeriesResponse> {
    const tsRange = resolveDashboardTimeSeriesRange(range);
    const [seriesRows, currencyRows] = await Promise.all([
      this.repo.getRevenueTimeSeries(range),
      this.repo.getRevenueByCurrency(tsRange),
    ]);

    const currency = settlementCurrencyFromRevenueRows(currencyRows);

    const rows = seriesRows.map(r => {
      const gmv = parseNum(r.gmv);
      const platformCommission = parseNum(r.platformCommission);
      const vatOnCommission = parseNum(r.vatOnCommission);
      const processorFees = parseNum(r.processorFees);
      const netPlatformIncome = roundOrderAmount(
        platformCommission + vatOnCommission - processorFees,
      );

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

      return {
        day: toIsoDateOnly(r.day as Date),
        gmv: formatNumericString(gmv),
        platformCommission: formatNumericString(platformCommission),
        vatOnCommission: formatNumericString(vatOnCommission),
        processorFees: formatNumericString(processorFees),
        netPlatformIncome: formatNumericString(netPlatformIncome),
        platformIncomeVatAmount: formatNumericString(platformIncomeVatAmount),
        netPlatformIncomeAfterIncomeVat: formatNumericString(
          netPlatformIncomeAfterIncomeVat,
        ),
      };
    });

    return {
      rows,
      currency,
      mixedCurrency: currencyRows.length > 1,
    };
  }

  async getOrdersTimeSeries(
    range: DashboardDateRange,
  ): Promise<GetDashboardOrdersTimeSeriesResponse> {
    const raw = await this.repo.getOrdersTimeSeries(range);

    return {
      rows: raw.map(r => ({
        day: toIsoDateOnly(r.day as Date),
        total: Number(r.total ?? 0),
        confirmed: Number(r.confirmed ?? 0),
        pending: Number(r.pending ?? 0),
        expired: Number(r.expired ?? 0),
        cancelled: Number(r.cancelled ?? 0),
      })),
    };
  }

  async getTicketsTimeSeries(
    range: DashboardDateRange,
  ): Promise<GetDashboardTicketsTimeSeriesResponse> {
    const [publishedRows, soldRows] = await Promise.all([
      this.repo.getTicketsPublishedTimeSeries(range),
      this.repo.getTicketsSoldTimeSeries(range),
    ]);

    const map = new Map<string, {published: number; sold: number}>();

    for (const r of publishedRows) {
      const day = toIsoDateOnly(r.day as Date);
      const cur = map.get(day) ?? {published: 0, sold: 0};
      cur.published = Number(r.published ?? 0);
      map.set(day, cur);
    }

    for (const r of soldRows) {
      const day = toIsoDateOnly(r.day as Date);
      const cur = map.get(day) ?? {published: 0, sold: 0};
      cur.sold = Number(r.sold ?? 0);
      map.set(day, cur);
    }

    const rows = [...map.keys()]
      .sort()
      .map(day => ({
        day,
        published: map.get(day)!.published,
        sold: map.get(day)!.sold,
      }));

    return {rows};
  }

  async getRevenueByOrderCurrency(
    range: DashboardDateRange,
  ): Promise<GetDashboardRevenueByOrderCurrencyResponse> {
    const rows = await this.repo.getRevenueByOrderCurrency(range);
    return {
      rows: rows.map(r => ({
        currency: r.currency as EventTicketCurrency,
        gmv: r.gmv ?? '0',
        platformCommission: r.platformCommission ?? '0',
        vatOnCommission: r.vatOnCommission ?? '0',
        orderCount: Number(r.orderCount ?? 0),
      })),
    };
  }
}
