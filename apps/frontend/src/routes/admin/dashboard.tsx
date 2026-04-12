import {
  createFileRoute,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';
import {z} from 'zod';
import {seo} from '~/utils/seo';
import {DashboardPage} from '~/features/admin/dashboard/DashboardPage';
import {
  buildAdminDashboardApiQuery,
  type DashboardSearch,
} from '~/features/admin/dashboard/dashboard-params';
import {
  adminDashboardTicketsQueryOptions,
  adminDashboardRevenueQueryOptions,
  adminDashboardOrdersQueryOptions,
  adminDashboardPayoutsQueryOptions,
  adminDashboardHealthQueryOptions,
  adminDashboardTopEventsQueryOptions,
  adminDashboardRevenueTimeSeriesQueryOptions,
  adminDashboardOrdersTimeSeriesQueryOptions,
  adminDashboardTicketsTimeSeriesQueryOptions,
} from '~/lib/api/admin';

const dashboardSearchSchema = z
  .object({
    periodo: z.enum(['hoy', '7d', '30d', 'todo']).optional().default('7d'),
    desde: z.string().optional(),
    hasta: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasDesde = data.desde != null && data.desde !== '';
    const hasHasta = data.hasta != null && data.hasta !== '';
    if (hasDesde !== hasHasta) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Indicá inicio y fin del rango personalizado',
        path: ['desde'],
      });
    }
  });

export const Route = createFileRoute('/admin/dashboard')({
  component: AdminDashboardRoute,
  validateSearch: dashboardSearchSchema,
  loaderDeps: ({search}) => ({
    apiQuery: buildAdminDashboardApiQuery({
      periodo: search.periodo ?? '7d',
      desde: search.desde,
      hasta: search.hasta,
    }),
  }),
  loader: async ({context, deps}) => {
    const {queryClient} = context;
    const {apiQuery} = deps;
    await Promise.all([
      queryClient.ensureQueryData(adminDashboardTicketsQueryOptions(apiQuery)),
      queryClient.ensureQueryData(adminDashboardRevenueQueryOptions(apiQuery)),
      queryClient.ensureQueryData(adminDashboardOrdersQueryOptions(apiQuery)),
      queryClient.ensureQueryData(adminDashboardPayoutsQueryOptions(apiQuery)),
      queryClient.ensureQueryData(adminDashboardHealthQueryOptions()),
      queryClient.ensureQueryData(adminDashboardTopEventsQueryOptions(apiQuery)),
      queryClient.ensureQueryData(
        adminDashboardRevenueTimeSeriesQueryOptions(apiQuery),
      ),
      queryClient.ensureQueryData(
        adminDashboardOrdersTimeSeriesQueryOptions(apiQuery),
      ),
      queryClient.ensureQueryData(
        adminDashboardTicketsTimeSeriesQueryOptions(apiQuery),
      ),
    ]);
  },
  head: () => ({
    meta: [
      ...seo({
        title: 'Panel | Administración | Revendiste',
        noIndex: true,
      }),
    ],
  }),
});

function AdminDashboardRoute() {
  const search = useSearch({from: '/admin/dashboard'});
  const navigate = useNavigate({from: '/admin/dashboard'});

  const dashboardSearch: DashboardSearch = {
    periodo: search.periodo ?? '7d',
    desde: search.desde,
    hasta: search.hasta,
  };

  return (
    <DashboardPage
      search={dashboardSearch}
      onNavigateSearch={next =>
        navigate({
          search: prev => ({
            ...prev,
            ...next,
          }),
        })
      }
    />
  );
}
