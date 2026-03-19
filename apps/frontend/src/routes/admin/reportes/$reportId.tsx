import {createFileRoute} from '@tanstack/react-router';
import {ReportDetailPage} from '~/features/ticket-reports';
import {seo} from '~/utils/seo';
import {
  adminTicketReportDetailQueryOptions,
  adminReportAttachmentsQuery,
} from '~/lib';

export const Route = createFileRoute('/admin/reportes/$reportId')({
  component: () => {
    const {reportId} = Route.useParams();
    return <ReportDetailPage reportId={reportId} isAdmin={true} />;
  },
  head: () => ({
    meta: [
      ...seo({
        title: 'Detalle de Reporte | Admin | Revendiste',
        noIndex: true,
      }),
    ],
  }),
  loader: ({context, params}) => {
    context.queryClient.prefetchQuery(
      adminTicketReportDetailQueryOptions(params.reportId),
    );
    context.queryClient.prefetchQuery(
      adminReportAttachmentsQuery(params.reportId),
    );
  },
});
