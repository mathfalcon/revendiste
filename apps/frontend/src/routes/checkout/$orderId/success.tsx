import {createFileRoute, redirect} from '@tanstack/react-router';
import {getOrderByIdQuery} from '~/lib';
import {CheckoutSuccessPage} from '~/features/checkout/CheckoutSuccess';
import {AxiosError} from 'axios';

export const Route = createFileRoute('/checkout/$orderId/success')({
  component: RouteComponent,
  loader: async ({context, params}) => {
    try {
      await context.queryClient.ensureQueryData(
        getOrderByIdQuery(params.orderId),
      );
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        throw redirect({
          to: '/ingresar/$',
        });
      }
      throw error;
    }
  },
  head: () => ({
    meta: [
      {
        title: 'Compra Exitosa | Revendiste',
      },
    ],
  }),
});

function RouteComponent() {
  const {orderId} = Route.useParams();
  return <CheckoutSuccessPage orderId={orderId} />;
}
