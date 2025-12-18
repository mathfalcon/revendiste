import {auth} from '@clerk/tanstack-react-start/server';
import {createFileRoute, redirect} from '@tanstack/react-router';
import {Suspense} from 'react';
import {FullScreenLoading} from '~/components';
import {EventPage} from '~/features/event';
import {getEventByIdQuery} from '~/lib';
import {AxiosError} from 'axios';

export const Route = createFileRoute('/eventos/$eventId')({
  component: RouteComponent,
  loader: async ({context, params}) => {
    try {
      await context.queryClient.ensureQueryData(
        getEventByIdQuery(params.eventId),
      );
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          throw redirect({
            to: '/ingresar/$',
          });
        }
        if (error.response?.status === 403) {
          const contentType = error.response.headers['content-type'] || '';
          if (!contentType.includes('text/html')) {
            throw redirect({
              to: '/ingresar/$',
            });
          }
        }
      }
      throw error;
    }
  },
});

function RouteComponent() {
  return (
    <Suspense fallback={<FullScreenLoading />}>
      <EventPage />
    </Suspense>
  );
}
