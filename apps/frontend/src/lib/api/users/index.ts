import {queryOptions} from '@tanstack/react-query';
import {api} from '..';

export const getCurrentUserQuery = () =>
  queryOptions({
    queryKey: ['users', 'me'],
    queryFn: () => api.users.getCurrentUser().then(res => res.data),
  });

