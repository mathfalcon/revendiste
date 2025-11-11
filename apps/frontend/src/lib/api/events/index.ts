import {queryOptions, infiniteQueryOptions} from '@tanstack/react-query';
import {api, PaginationQuery} from '..';

export const getEventsPaginatedQuery = (pagination: PaginationQuery) =>
  queryOptions({
    queryKey: ['events'],
    queryFn: () => api.events.getAllPaginated(pagination).then(res => res.data),
  });

export const getEventsInfiniteQuery = (limit: number = 20) =>
  infiniteQueryOptions({
    queryKey: ['events', 'infinite'],
    queryFn: ({pageParam = 1}) =>
      api.events
        .getAllPaginated({limit, page: pageParam})
        .then(res => res.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.pagination.hasNext) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });

export const getEventByIdQuery = (eventId: string) =>
  queryOptions({
    queryKey: ['events', eventId],
    queryFn: () => api.events.getById(eventId).then(res => res.data),
    enabled: !!eventId && eventId.length > 0,
  });

export const getEventBySearchQuery = (searchQuery: string) =>
  queryOptions({
    queryKey: ['events', 'search', searchQuery],
    queryFn: () =>
      api.events.getBySearch({query: searchQuery}).then(res => res.data),
  });
