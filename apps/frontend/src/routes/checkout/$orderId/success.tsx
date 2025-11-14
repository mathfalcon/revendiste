import {createFileRoute} from '@tanstack/react-router';
import {getOrderByIdQuery} from '~/lib';
import {CheckoutSuccessPage} from '~/features/checkout/CheckoutSuccess';

export const Route = createFileRoute('/checkout/$orderId/success')({
  component: RouteComponent,
  loader: async ({context, params}) => {
    void context.queryClient.ensureQueryData(getOrderByIdQuery(params.orderId));
  },
});

function RouteComponent() {
  const {orderId} = Route.useParams();
  return <CheckoutSuccessPage orderId={orderId} />;
}
