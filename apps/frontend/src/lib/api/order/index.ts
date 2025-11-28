import {mutationOptions, queryOptions} from '@tanstack/react-query';
import {AxiosError} from 'axios';
import {api, CreateOrderRouteBody, PendingOrderErrorResponse} from '..';
import {toast} from 'sonner';

export interface PostOrderMutationOptions {
  onOrderCreated?: (orderId: string) => void;
  onPendingOrderFound?: (orderId: string) => void;
}

export const postOrderMutation = (options?: PostOrderMutationOptions) =>
  mutationOptions({
    mutationKey: ['create-order'],
    mutationFn: (data: CreateOrderRouteBody) =>
      api.orders.create(data).then(data => data.data),
    onSuccess(data) {
      toast.success(
        'Orden creada con éxito, por favor completa el pago para confirmar la reserva',
      );
      options?.onOrderCreated?.(data.id);
    },
    onError: (error: unknown) => {
      // Check if this is an Axios error with a pending order response
      if (error instanceof AxiosError) {
        const errorData = error.response?.data as
          | PendingOrderErrorResponse
          | undefined;

        if (errorData?.statusCode === 422 && errorData?.metadata?.orderId) {
          // User has an existing pending order
          options?.onPendingOrderFound?.(errorData.metadata.orderId);
          return;
        }
      }
      // Other errors are handled by the API interceptor (toast notification)
    },
  });

export const getOrderByIdQuery = (orderId: string) =>
  queryOptions({
    queryKey: ['orders', orderId],
    queryFn: () => api.orders.getById(orderId).then(res => res.data),
    enabled: !!orderId && orderId.length > 0,
  });

export const getMyOrdersQuery = () =>
  queryOptions({
    queryKey: ['orders', 'my-orders'],
    queryFn: () => api.orders.getMyOrders().then(res => res.data),
  });

export const getOrderTicketsQuery = (orderId: string) =>
  queryOptions({
    queryKey: ['orders', orderId, 'tickets'],
    queryFn: () => api.orders.getOrderTickets(orderId).then(res => res.data),
    enabled: !!orderId && orderId.length > 0,
  });
