import type {AdminDashboardApiQuery} from '~/lib/api/admin';

export type DashboardSearch = {
  periodo: 'hoy' | '7d' | '30d' | 'todo';
  desde?: string;
  hasta?: string;
};

const PERIOD_TO_API: Record<
  DashboardSearch['periodo'],
  NonNullable<AdminDashboardApiQuery['period']>
> = {
  hoy: 'today',
  '7d': '7d',
  '30d': '30d',
  todo: 'all',
};

/** Maps validated URL search params to backend dashboard query params. */
export function buildAdminDashboardApiQuery(
  search: DashboardSearch,
): AdminDashboardApiQuery {
  if (search.desde && search.hasta) {
    return {from: search.desde, to: search.hasta};
  }
  return {period: PERIOD_TO_API[search.periodo]};
}
