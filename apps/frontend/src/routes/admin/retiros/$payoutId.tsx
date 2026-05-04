import {createFileRoute} from '@tanstack/react-router';
import {PayoutDetailPage} from '~/features/admin/payouts/PayoutDetailPage';
import {adminPayoutDetailsQueryOptions} from '~/lib/api/admin';

export const Route = createFileRoute('/admin/retiros/$payoutId')({
  component: AdminPayoutDetailRoute,
  loader: ({context, params}) => {
    return context.queryClient.ensureQueryData(
      adminPayoutDetailsQueryOptions(params.payoutId),
    );
  },
});

function AdminPayoutDetailRoute() {
  const {payoutId} = Route.useParams();
  return <PayoutDetailPage payoutId={payoutId} />;
}
