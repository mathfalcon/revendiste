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

export interface GetDashboardRevenueResponse {
  gmv: string;
  platformCommission: string;
  vatOnCommission: string;
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
   * % del total comisión + IVA (pedido) que representan los fees del procesador.
   * Denominador: platformCommission + vatOnCommission.
   */
  processorFeesPercentOfCommissionAndVat: number;
  /**
   * % del total comisión + IVA (pedido) que queda como ingreso neto plataforma.
   */
  netPlatformIncomePercentOfCommissionAndVat: number;
  currency: EventTicketCurrency;
  mixedCurrency: boolean;
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
