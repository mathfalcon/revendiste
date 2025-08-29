import {createFileRoute} from '@tanstack/react-router';
import {Suspense} from 'react';
import {FullScreenLoading} from '~/components';
import {EventPage} from '~/features/event';
import {getEventByIdQuery} from '~/lib';

export const Route = createFileRoute('/eventos/$eventId')({
  component: RouteComponent,
  loader: ({context, params}) => {
    // Kick off loading as early as possible!
    void context.queryClient.prefetchQuery(getEventByIdQuery(params.eventId));
  },
});

function RouteComponent() {
  return (
    <Suspense fallback={<FullScreenLoading />}>
      <EventPage />
    </Suspense>
  );
}
