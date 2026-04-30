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
  DashboardRevenuePartyAmounts,
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
    rows.length === 1 ? rows[0]!.currency : (rows[0]?.currency ?? 'UYU');
  return (raw ?? 'UYU') as EventTicketCurrency;
}

function mergeRevenueByPartyFromSettlementRows(
  partyRows: {
    currency: string | null;
    party: string;
    platformRevenue: string | null;
    vatOnRevenue: string | null;
  }[],
  settlementCurrencyRows: {currency: string | null}[],
  mixedSettlementCurrency: boolean,
): Record<string, DashboardRevenuePartyAmounts> {
  const filtered =
    mixedSettlementCurrency || settlementCurrencyRows.length === 0
      ? partyRows
      : partyRows.filter(
          row => row.currency === settlementCurrencyRows[0]?.currency,
        );

  const acc = new Map<string, {base: number; vat: number}>();
  for (const row of filtered) {
    const cur = acc.get(row.party) ?? {base: 0, vat: 0};
    cur.base += parseNum(row.platformRevenue);
    cur.vat += parseNum(row.vatOnRevenue);
    acc.set(row.party, cur);
  }

  const out: Record<string, DashboardRevenuePartyAmounts> = {};
  for (const [party, v] of acc) {
    out[party] = {
      base: formatNumericString(v.base),
      vat: formatNumericString(v.vat),
    };
  }
  return out;
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
    const [rows, partyRows, ordersMissingInvoices] = await Promise.all([
      this.repo.getRevenueByCurrency(range),
      this.repo.getRevenuePartyBreakdownSettlement(range),
      this.repo.countOrdersMissingIssuedInvoices(range),
    ]);

    let gmv = 0;
    let platformRevenue = 0;
    let vatOnRevenue = 0;
    let processorFees = 0;

    for (const r of rows) {
      gmv += parseNum(r.gmv);
      platformRevenue += parseNum(r.platformRevenue);
      vatOnRevenue += parseNum(r.vatOnRevenue);
      processorFees += parseNum(r.processorFees);
    }

    const netPlatformIncome = roundOrderAmount(
      platformRevenue + vatOnRevenue - processorFees,
    );

    const commissionPlusVat = platformRevenue + vatOnRevenue;
    let platformIncomeVatAmount = 0;
    let netPlatformIncomeAfterIncomeVat = netPlatformIncome;
    if (netPlatformIncome > 0) {
      platformIncomeVatAmount = roundOrderAmount(netPlatformIncome * VAT_RATE);
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
    const mixedCurrency = rows.length > 1;
    const revenueByParty = mergeRevenueByPartyFromSettlementRows(
      partyRows,
      rows,
      mixedCurrency,
    );

    return {
      gmv: formatNumericString(gmv),
      platformRevenue: formatNumericString(platformRevenue),
      vatOnRevenue: formatNumericString(vatOnRevenue),
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
      mixedCurrency,
      revenueByParty,
      ordersMissingInvoices,
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
      const platformRevenue = parseNum(r.platformRevenue);
      const vatOnRevenue = parseNum(r.vatOnRevenue);
      const processorFees = parseNum(r.processorFees);
      const netPlatformIncome = roundOrderAmount(
        platformRevenue + vatOnRevenue - processorFees,
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
        platformRevenue: formatNumericString(platformRevenue),
        vatOnRevenue: formatNumericString(vatOnRevenue),
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

    const rows = [...map.keys()].sort().map(day => ({
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
        platformRevenue: r.platformRevenue ?? '0',
        vatOnRevenue: r.vatOnRevenue ?? '0',
        orderCount: Number(r.orderCount ?? 0),
      })),
    };
  }
}
