import {mutationOptions} from '@tanstack/react-query';
import {api} from '..';

export const createPaymentLinkMutation = (orderId: string) =>
  mutationOptions({
    mutationKey: ['create-payment-link', orderId],
    mutationFn: () =>
      api.payments.createPaymentLink(orderId).then(response => response.data),
  });
