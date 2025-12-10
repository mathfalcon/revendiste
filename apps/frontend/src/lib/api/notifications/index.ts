import {
  queryOptions,
  infiniteQueryOptions,
  mutationOptions,
} from '@tanstack/react-query';
import {api} from '..';

export const getNotificationsQuery = (
  includeSeen: boolean = true,
  page: number = 1,
  limit: number = 20,
) =>
  queryOptions({
    queryKey: ['notifications', includeSeen, page, limit],
    queryFn: () =>
      api.notifications
        .getNotifications({includeSeen, page, limit})
        .then(res => res.data),
  });

export const getNotificationsInfiniteQuery = (
  includeSeen: boolean = true,
  limit: number = 20,
) =>
  infiniteQueryOptions({
    queryKey: ['notifications', 'infinite', includeSeen],
    queryFn: ({pageParam = 1}) =>
      api.notifications
        .getNotifications({includeSeen, page: pageParam, limit})
        .then(res => res.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.pagination.hasNext) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });

export const getUnseenCountQuery = () =>
  queryOptions({
    queryKey: ['notifications', 'unseen-count'],
    queryFn: () => api.notifications.getUnseenCount().then(res => res.data),
  });

export const markAsSeenMutation = () =>
  mutationOptions({
    mutationFn: (notificationId: string) =>
      api.notifications.markAsSeen(notificationId).then(res => res.data),
  });

export const markAllAsSeenMutation = () =>
  mutationOptions({
    mutationFn: () => api.notifications.markAllAsSeen().then(res => res.data),
  });

export const deleteNotificationMutation = () =>
  mutationOptions({
    mutationFn: (notificationId: string) =>
      api.notifications
        .deleteNotification(notificationId)
        .then(res => res.data),
  });
