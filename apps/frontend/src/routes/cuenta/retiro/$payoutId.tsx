import {createFileRoute} from '@tanstack/react-router';
import {PayoutDetailPage} from '~/features/user-account/payouts/PayoutDetailPage';
import {PayoutDetailPageSkeleton} from '~/features/user-account/payouts/PayoutDetailPageSkeleton';
import {getPayoutDetailsQuery} from '~/lib/api/payouts';
import {seo} from '~/utils/seo';

export const Route = createFileRoute('/cuenta/retiro/$payoutId')({
  pendingComponent: PayoutDetailPageSkeleton,
  component: () => {
    const {payoutId} = Route.useParams();
    return <PayoutDetailPage payoutId={payoutId} />;
  },
  loader: ({context, params}) => {
    void context.queryClient.prefetchQuery(
      getPayoutDetailsQuery(params.payoutId),
    );
  },
  head: () => ({
    meta: [
      ...seo({
        title: 'Tu retiro | Revendiste',
        noIndex: true,
      }),
    ],
  }),
});
