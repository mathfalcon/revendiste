import {createFileRoute} from '@tanstack/react-router';
import {ReportDetailPage} from '~/features/ticket-reports';
import {seo} from '~/utils/seo';
import {getTicketReportDetailQuery, getReportAttachmentsQuery} from '~/lib';

export const Route = createFileRoute('/cuenta/reportes/$reportId')({
  component: () => {
    const {reportId} = Route.useParams();
    return <ReportDetailPage reportId={reportId} isAdmin={false} />;
  },
  head: () => ({
    meta: [
      ...seo({
        title: 'Detalle de Reporte | Revendiste',
        noIndex: true,
      }),
    ],
  }),
  loader: ({context, params}) => {
    context.queryClient.prefetchQuery(
      getTicketReportDetailQuery(params.reportId),
    );
    context.queryClient.prefetchQuery(
      getReportAttachmentsQuery(params.reportId),
    );
  },
});
