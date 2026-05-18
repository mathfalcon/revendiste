import {queryOptions} from '@tanstack/react-query';
import {api} from '..';

export const getTicketCodeQuery = (listingTicketId: string) =>
  queryOptions({
    queryKey: ['tickets', listingTicketId, 'code'],
    queryFn: () =>
      api.tickets
        .issueTicketCode(listingTicketId, {
          headers: {'X-Silent-Error': 'true'},
        })
        .then(res => res.data),
    enabled: !!listingTicketId && listingTicketId.length > 0,
    retry: false,
  });
