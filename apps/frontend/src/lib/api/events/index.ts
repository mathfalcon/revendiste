import {queryOptions} from '@tanstack/react-query';
import {api, PaginationQuery} from '..';

export const getEventsPaginatedQuery = (pagination: PaginationQuery) =>
  queryOptions({
    queryKey: ['events'],
    queryFn: () => api.events.getAllPaginated(pagination).then(res => res.data),
  });

export const getEventByIdQuery = (eventId: string) =>
  queryOptions({
    queryKey: ['events', eventId],
    queryFn: () => api.events.getById(eventId).then(res => res.data),
  });
