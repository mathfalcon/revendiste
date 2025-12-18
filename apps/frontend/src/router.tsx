import {QueryClient} from '@tanstack/react-query';
import {createRouter as createTanStackRouter} from '@tanstack/react-router';
import {routerWithQueryClient} from '@tanstack/react-router-with-query';
import {routeTree} from './routeTree.gen';
import {DefaultCatchBoundary} from './components/DefaultCatchBoundary';
import {NotFound} from './components/NotFound';
import {FullScreenLoading} from './components';

// NOTE: Most of the integration code found here is experimental and will
// definitely end up in a more streamlined API in the future. This is just
// to show what's possible with the current APIs.

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {retry: false, staleTime: 1000 * 60 * 5},
      mutations: {retry: false},
    },
  });

  return routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      context: {queryClient},
      defaultPreload: 'intent',
      defaultErrorComponent: DefaultCatchBoundary,
      defaultNotFoundComponent: () => <NotFound />,
      defaultPendingComponent: () => <FullScreenLoading />,
      scrollRestoration: true,
    }),
    queryClient,
  );
}
