import {
  infiniteQueryOptions,
  queryOptions,
  mutationOptions,
} from '@tanstack/react-query';
import {AddPayoutMethodRouteBody, UpdatePayoutMethodRouteBody, api} from '..';
import {toast} from 'sonner';

export const getBalanceQuery = () =>
  queryOptions({
    queryKey: ['payouts', 'balance'],
    queryFn: () => api.payouts.getBalance().then(res => res.data),
  });

export const getAvailableEarningsQuery = () =>
  queryOptions({
    queryKey: ['payouts', 'available-earnings'],
    queryFn: () => api.payouts.getAvailableEarnings().then(res => res.data),
  });

export const getPayoutHistoryQuery = (page: number = 1, limit: number = 20) =>
  queryOptions({
    queryKey: ['payouts', 'history', page, limit],
    queryFn: () =>
      api.payouts
        .getPayoutHistory({
          page,
          limit,
          sortBy: 'requestedAt',
          sortOrder: 'desc',
        })
        .then(res => res.data),
  });

const PAYOUT_HISTORY_PAGE = 20;

export const getPayoutHistoryInfiniteQuery = () =>
  infiniteQueryOptions({
    queryKey: ['payouts', 'history', 'infinite', PAYOUT_HISTORY_PAGE] as const,
    initialPageParam: 1,
    queryFn: ({pageParam}) =>
      api.payouts
        .getPayoutHistory({
          page: pageParam,
          limit: PAYOUT_HISTORY_PAGE,
          sortBy: 'requestedAt',
          sortOrder: 'desc',
        })
        .then(res => res.data),
    getNextPageParam: lastPage =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
  });

export const getPayoutDetailsQuery = (payoutId: string) =>
  queryOptions({
    queryKey: ['payouts', 'details', payoutId],
    queryFn: () => api.payouts.getPayoutDetails(payoutId).then(res => res.data),
  });

export const requestPayoutMutation = () =>
  mutationOptions({
    mutationKey: ['request-payout'],
    mutationFn: (data: {
      payoutMethodId: string;
      listingTicketIds?: string[];
      listingIds?: string[];
    }) => api.payouts.requestPayout(data).then(res => res.data),
    onSuccess: () => {
      toast.success('Solicitud de retiro creada');
    },
  });

export const getPayoutMethodsQuery = () =>
  queryOptions({
    queryKey: ['payouts', 'payout-methods'],
    queryFn: () => api.payouts.getPayoutMethods().then(res => res.data),
  });

export const addPayoutMethodMutation = () =>
  mutationOptions({
    mutationKey: ['add-payout-method'],
    mutationFn: (data: AddPayoutMethodRouteBody) =>
      api.payouts.addPayoutMethod(data).then(res => res.data),
    onSuccess: () => {
      toast.success('Método de pago agregado');
    },
  });

export const updatePayoutMethodMutation = () =>
  mutationOptions({
    mutationKey: ['update-payout-method'],
    mutationFn: ({
      payoutMethodId,
      data,
    }: {
      payoutMethodId: string;
      data: UpdatePayoutMethodRouteBody;
    }) =>
      api.payouts
        .updatePayoutMethod(payoutMethodId, data)
        .then(res => res.data),
    onSuccess: () => {
      toast.success('Método de pago actualizado');
    },
  });

export const deletePayoutMethodMutation = () =>
  mutationOptions({
    mutationKey: ['delete-payout-method'],
    mutationFn: (payoutMethodId: string) =>
      api.payouts.deletePayoutMethod(payoutMethodId).then(res => res.data),
    onSuccess: () => {
      toast.success('Método de pago eliminado');
    },
  });
