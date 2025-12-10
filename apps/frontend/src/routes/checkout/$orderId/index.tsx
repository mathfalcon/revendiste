import {createFileRoute, redirect} from '@tanstack/react-router';
import {getOrderByIdQuery} from '~/lib';
import {CheckoutPage} from '~/features/checkout';
import {AxiosError} from 'axios';

export const Route = createFileRoute('/checkout/$orderId/')({
  component: RouteComponent,
  loader: async ({context, params}) => {
    try {
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
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        throw redirect({
          to: '/ingresar/$',
        });
      }
      throw error;
    }
  },
});

function RouteComponent() {
  const {orderId} = Route.useParams();
  return <CheckoutPage orderId={orderId} />;
}
