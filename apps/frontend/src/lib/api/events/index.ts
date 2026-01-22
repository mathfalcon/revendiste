import {queryOptions, infiniteQueryOptions} from '@tanstack/react-query';
import {api, PaginationQuery} from '..';

interface EventsFilter {
  city?: string;
}

export const getEventsPaginatedQuery = (
  pagination: PaginationQuery,
  filters?: EventsFilter,
) =>
  queryOptions({
    queryKey: ['events', pagination, filters],
    queryFn: () =>
      api.events
        .getAllPaginated({...pagination, city: filters?.city})
        .then(res => res.data),
  });

export const getEventsInfiniteQuery = (
  limit: number = 20,
  filters?: EventsFilter,
) =>
  infiniteQueryOptions({
    queryKey: ['events', 'infinite', filters],
    queryFn: ({pageParam = 1}) =>
      api.events
        .getAllPaginated({limit, page: pageParam, city: filters?.city})
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

/**
 * Get distinct cities for the city filter dropdown
 */
export const getEventCitiesQuery = () =>
  queryOptions({
    queryKey: ['events', 'cities'],
    queryFn: () => api.events.getDistinctCities().then(res => res.data),
    staleTime: 1000 * 60 * 5, // 5 minutes - cities don't change often
  });

/**
 * Get trending events based on view count
 */
export const getTrendingEventsQuery = (days: number = 7, limit: number = 10) =>
  queryOptions({
    queryKey: ['events', 'trending', days, limit],
    queryFn: () =>
      api.events.getTrendingEvents({days, limit}).then(res => res.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

/**
 * Track a view for an event
 */
export const trackEventView = async (eventId: string) => {
  return api.events.trackView(eventId).then(res => res.data);
};
