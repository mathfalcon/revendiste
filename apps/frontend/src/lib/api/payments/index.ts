import {mutationOptions} from '@tanstack/react-query';
import {api} from '..';

export interface CreatePaymentLinkVariables {
  /** Payer country ISO 3166-1 alpha-2 (e.g. UY, AR). */
  country?: string;
}

export const createPaymentLinkMutation = (orderId: string) =>
  mutationOptions({
    mutationKey: ['create-payment-link', orderId],
    mutationFn: (variables?: CreatePaymentLinkVariables) =>
      api.payments
        .createPaymentLink(orderId, variables ?? {})
        .then(response => response.data),
  });
