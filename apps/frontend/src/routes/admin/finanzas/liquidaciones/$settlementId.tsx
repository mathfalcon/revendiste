import {createFileRoute} from '@tanstack/react-router';
import {SettlementDetailPage} from '~/features/admin/settlements/SettlementDetailPage';
import {adminSettlementBreakdownQueryOptions} from '~/lib/api/admin';

export const Route = createFileRoute(
  '/admin/finanzas/liquidaciones/$settlementId',
)({
  component: SettlementDetailRoute,
  loader: ({context, params}) => {
    return context.queryClient.ensureQueryData(
      adminSettlementBreakdownQueryOptions(params.settlementId),
    );
  },
});

function SettlementDetailRoute() {
  const {settlementId} = Route.useParams();
  return <SettlementDetailPage settlementId={settlementId} />;
}
