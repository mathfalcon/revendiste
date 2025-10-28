import {auth} from '@clerk/tanstack-react-start/server';
import {createFileRoute} from '@tanstack/react-router';
import {Suspense} from 'react';
import {FullScreenLoading} from '~/components';
import {EventPage} from '~/features/event';
import {getEventByIdQuery} from '~/lib';

export const Route = createFileRoute('/eventos/$eventId')({
  component: RouteComponent,
  loader: async ({context, params}) => {
    void context.queryClient.ensureQueryData(getEventByIdQuery(params.eventId));
  },
});

function RouteComponent() {
  return (
    <Suspense fallback={<FullScreenLoading />}>
      <EventPage />
    </Suspense>
  );
}
