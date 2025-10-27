import {mutationOptions, queryOptions} from '@tanstack/react-query';
import {api, CreateTicketListingRouteBody} from '..';
import {toast} from 'sonner';

export const postTicketListingMutation = () =>
  mutationOptions({
    mutationKey: ['create-ticket-listing'],
    mutationFn: (data: CreateTicketListingRouteBody) =>
      api.ticketListings.create(data).then(data => data.data),
    onSuccess(data) {
      // TODO: redirect to listings page
      toast.success('Entradas publicadas con éxito');
    },
  });

export const getMyListingsQuery = () =>
  queryOptions({
    queryKey: ['listings'],
    queryFn: () => api.ticketListings.getMyListings().then(data => data.data),
  });
