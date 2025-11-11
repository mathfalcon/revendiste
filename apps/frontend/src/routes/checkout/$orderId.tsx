import {createFileRoute} from '@tanstack/react-router';
import {getOrderByIdQuery} from '~/lib';
import {CheckoutPage} from '~/features/checkout';

export const Route = createFileRoute('/checkout/$orderId')({
  component: RouteComponent,
  loader: async ({context, params}) => {
    void context.queryClient.ensureQueryData(getOrderByIdQuery(params.orderId));
  },
});

function RouteComponent() {
  const {orderId} = Route.useParams();
  return <CheckoutPage orderId={orderId} />;
}
