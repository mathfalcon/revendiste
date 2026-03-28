import {queryOptions, infiniteQueryOptions} from '@tanstack/react-query';
import {api, PaginationQuery} from '..';

interface EventsFilter {
  city?: string;
  region?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  dateFrom?: string;
  dateTo?: string;
  hasTickets?: boolean;
}

export const getEventsPaginatedQuery = (
  pagination: PaginationQuery,
  filters?: EventsFilter,
) =>
  queryOptions({
    queryKey: ['events', pagination, filters],
    queryFn: () =>
      api.events
        .getAllPaginated({...pagination, ...filters})
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
        .getAllPaginated({limit, page: pageParam, ...filters})
        .then(res => res.data),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
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
    staleTime: 1000 * 60 * 5,
  });

/**
 * Get distinct regions with active events, grouped by country
 */
export const getRegionsQuery = () =>
  queryOptions({
    queryKey: ['events', 'regions'],
    queryFn: () => api.events.getDistinctRegions().then(res => res.data),
    staleTime: 1000 * 60 * 10, // 10 minutes — regions change rarely
  });

/**
 * Get trending events based on view count
 */
export const getTrendingEventsQuery = (
  days: number = 7,
  limit: number = 10,
  locationFilter?: {
    region?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
  },
) =>
  queryOptions({
    queryKey: ['events', 'trending', days, limit, locationFilter],
    queryFn: () =>
      api.events
        .getTrendingEvents({days, limit, ...locationFilter})
        .then(res => res.data),
    staleTime: 1000 * 60 * 5,
  });

/**
 * Track a view for an event (fire-and-forget, errors are silently ignored)
 */
export const trackEventView = (eventId: string) => {
  return api.events.trackView(eventId).catch(() => {
    // Silently ignore errors - view tracking is not critical
  });
};
