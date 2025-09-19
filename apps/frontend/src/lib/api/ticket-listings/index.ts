import {mutationOptions} from '@tanstack/react-query';
import {api, CreateTicketListingRouteBody} from '..';
import {toast} from 'sonner';

export const postTicketListingMutation = () =>
  mutationOptions({
    mutationKey: ['create-ticket-listing'],
    mutationFn: (data: CreateTicketListingRouteBody) =>
      api.ticketListings.create(data),
    onSuccess() {
      toast.success('Entradas publicadas con éxito');
    },
  });
