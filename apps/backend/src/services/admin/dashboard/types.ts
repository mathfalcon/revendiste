/**
 * Dashboard API response shapes (used by AdminDashboardService and OpenAPI).
 * Kept explicit so TSOA does not have to expand deep Kysely-inferred types.
 */

import type {EventTicketCurrency} from '@revendiste/shared';

export interface GetDashboardTicketsResponse {
  publishedActiveEvents: number;
  publishedTotal: number;
  sold: number;
  activeListings: number;
}

/** Per-invoice-party amounts (excl. VAT on line / VAT on line) from issued invoices. */
export interface DashboardRevenuePartyAmounts {
  base: string;
  vat: string;
}

export interface GetDashboardRevenueResponse {
  gmv: string;
  /**
   * Comisión facturada (suma `invoices.base_amount` emitidas), todas las partes.
   * Antes se exponía como `platformCommission` (solo comprador); renombrado para reflejar la fuente real.
   */
  platformRevenue: string;
  /**
   * IVA sobre comisión facturada (suma `invoices.vat_amount` emitidas).
   */
  vatOnRevenue: string;
  processorFees: string;
  netPlatformIncome: string;
  /**
   * IVA estimado sobre el ingreso neto plataforma (tasa = platformIncomeVatRate).
   * Solo aplica si el ingreso neto es positivo.
   */
  platformIncomeVatAmount: string;
  /**
   * Ingreso neto plataforma menos platformIncomeVatAmount (estimación post-IVA empresa).
   */
  netPlatformIncomeAfterIncomeVat: string;
  /** Tasa usada (0–1), coincide con VAT_RATE del entorno (p. ej. 0.22). */
  platformIncomeVatRate: number;
  /**
   * % del total comisión + IVA facturada que representan los fees del procesador.
   * Denominador: platformRevenue + vatOnRevenue.
   */
  processorFeesPercentOfCommissionAndVat: number;
  /**
   * % del total comisión + IVA facturada que queda como ingreso neto plataforma.
   */
  netPlatformIncomePercentOfCommissionAndVat: number;
  /**
   * Moneda de liquidación del procesador (`payments.balance_currency`), no la moneda del pedido.
   * Los importes numéricos del bloque están expresados en esta moneda (GMV/comisión/IVA convertidos con `exchange_rate` cuando aplica).
   */
  currency: EventTicketCurrency;
  /**
   * `true` si hay pagos pagados con más de un `balance_currency` en el rango.
   * Ya no indica solo “pedidos en monedas distintas”: varias monedas de cargo pueden seguir mostrándose como una sola moneda de liquidación.
   */
  mixedCurrency: boolean;
  /**
   * Importes por parte (`buyer`, `seller`, …) en la misma moneda de liquidación que los totales cuando solo hay una moneda de liquidación;
   * si hay varias, se fusionan sumando por parte (mezcla de monedas — revisar desglose).
   */
  revenueByParty: Record<string, DashboardRevenuePartyAmounts>;
  /**
   * Pedidos confirmados con `platformCommission` > 0 pero sin ninguna factura `issued` (FEU pendiente o fallida).
   */
  ordersMissingInvoices: number;
}

export interface GetDashboardOrdersResponse {
  pending: number;
  confirmed: number;
  expired: number;
  cancelled: number;
  payments: {
    successful: number;
    failed: number;
    expired: number;
    conversionRate: number;
  };
}

export interface GetDashboardPayoutsResponse {
  pendingCount: number;
  pendingAmount: string;
  completedCount: number;
  completedAmount: string;
  availableEarnings: string;
  retainedEarnings: string;
  currency: EventTicketCurrency;
}

export interface GetDashboardHealthResponse {
  totalUsers: number;
  newUsers: number;
  pendingVerifications: number;
  openTicketReports: number;
  pendingJobs: number;
  activeEvents: number;
}

export interface DashboardTopEventRow {
  eventId: string;
  eventName: string;
  ticketsSold: number;
  revenue: string;
  listingCount: number;
}

export interface GetDashboardTopEventsResponse {
  events: DashboardTopEventRow[];
}

export interface RevenueTimeSeriesRow {
  /** ISO date `YYYY-MM-DD` (UTC bucket). */
  day: string;
  gmv: string;
  platformRevenue: string;
  vatOnRevenue: string;
  processorFees: string;
  netPlatformIncome: string;
  platformIncomeVatAmount: string;
  netPlatformIncomeAfterIncomeVat: string;
}

export interface GetDashboardRevenueTimeSeriesResponse {
  rows: RevenueTimeSeriesRow[];
  /** Misma semántica que `GetDashboardRevenueResponse.currency` (liquidación). */
  currency: EventTicketCurrency;
  /** Misma semántica que `GetDashboardRevenueResponse.mixedCurrency`. */
  mixedCurrency: boolean;
}

export interface OrderCurrencyBreakdownRow {
  /** Moneda de cobro del pedido (`orders.currency`). Importes sin conversión. */
  currency: EventTicketCurrency;
  gmv: string;
  platformRevenue: string;
  vatOnRevenue: string;
  orderCount: number;
}

export interface GetDashboardRevenueByOrderCurrencyResponse {
  rows: OrderCurrencyBreakdownRow[];
}

export interface OrdersTimeSeriesRow {
  day: string;
  total: number;
  confirmed: number;
  pending: number;
  expired: number;
  cancelled: number;
}

export interface GetDashboardOrdersTimeSeriesResponse {
  rows: OrdersTimeSeriesRow[];
}

export interface TicketsTimeSeriesRow {
  day: string;
  published: number;
  sold: number;
}

export interface GetDashboardTicketsTimeSeriesResponse {
  rows: TicketsTimeSeriesRow[];
}
