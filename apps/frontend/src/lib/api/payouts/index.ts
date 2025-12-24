import {queryOptions, mutationOptions} from '@tanstack/react-query';
import {api} from '..';
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
      api.payouts.getPayoutHistory({page, limit}).then(res => res.data),
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
      toast.success('Solicitud de pago creada exitosamente');
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
    mutationFn: (
      data:
        | {
            payoutType: 'uruguayan_bank';
            accountHolderName: string;
            accountHolderSurname: string;
            currency: 'UYU' | 'USD';
            metadata: {
              bank_name: string;
              account_number: string;
            };
            isDefault?: boolean;
          }
        | {
            payoutType: 'paypal';
            accountHolderName: string;
            accountHolderSurname: string;
            currency: 'USD';
            metadata: {
              email: string;
            };
            isDefault?: boolean;
          },
    ) => api.payouts.addPayoutMethod(data).then(res => res.data),
    onSuccess: () => {
      toast.success('Método de pago agregado exitosamente');
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
      data: {
        accountHolderName?: string;
        accountHolderSurname?: string;
        currency?: 'UYU' | 'USD';
        metadata?:
          | {
              bank_name: string;
              account_number: string;
            }
          | {
              email: string;
            };
        isDefault?: boolean;
      };
    }) =>
      api.payouts
        .updatePayoutMethod(payoutMethodId, data)
        .then(res => res.data),
    onSuccess: () => {
      toast.success('Método de pago actualizado exitosamente');
    },
  });

export const deletePayoutMethodMutation = () =>
  mutationOptions({
    mutationKey: ['delete-payout-method'],
    mutationFn: (payoutMethodId: string) =>
      api.payouts.deletePayoutMethod(payoutMethodId).then(res => res.data),
    onSuccess: () => {
      toast.success('Método de pago eliminado exitosamente');
    },
  });
