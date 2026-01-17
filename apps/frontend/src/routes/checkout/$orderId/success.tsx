import {createFileRoute, redirect} from '@tanstack/react-router';
import {getOrderByIdQuery} from '~/lib';
import {CheckoutSuccessPage} from '~/features/checkout/CheckoutSuccess';
import {AxiosError, isAxiosError} from 'axios';

export const Route = createFileRoute('/checkout/$orderId/success')({
  component: RouteComponent,
  loader: async ({context, params}) => {
    try {
      await context.queryClient.ensureQueryData(
        getOrderByIdQuery(params.orderId),
      );
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
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
