import {createFileRoute, redirect} from '@tanstack/react-router';
import {getOrderByIdQuery} from '~/lib';
import {CheckoutPage} from '~/features/checkout';

export const Route = createFileRoute('/checkout/$orderId/')({
  component: RouteComponent,
  loader: async ({context, params}) => {
    const order = await context.queryClient.ensureQueryData(
      getOrderByIdQuery(params.orderId),
    );

    // Redirect to success page if order is already confirmed
    if (order.status === 'confirmed') {
      throw redirect({
        to: '/checkout/$orderId/success',
        params: {orderId: params.orderId},
      });
    }
  },
});

function RouteComponent() {
  const {orderId} = Route.useParams();
  return <CheckoutPage orderId={orderId} />;
}
