import {Suspense} from 'react';
import z from 'zod';
import {FullScreenLoading} from '~/components';
import {TicketListingForm} from '~/features/ticket-listing';
import {createFileRoute} from '@tanstack/react-router';
import {redirectToSignInIfNotAuthenticated} from '~/utils/auth';

const CreateTicketListingSearchSchema = z.object({
  eventId: z.uuid().optional(),
});

export const Route = createFileRoute('/entradas/publicar')({
  component: RouteComponent,
  validateSearch: search => CreateTicketListingSearchSchema.parse(search),
  beforeLoad: () => redirectToSignInIfNotAuthenticated(),
  loaderDeps: ({search: {eventId}}) => ({eventId}),
  loader: ({deps: {eventId}}) => {
    // Prefetch event data for the form if eventId is provided in search params
    if (eventId) {
      // void context.queryClient.prefetchQuery(getEventByIdQuery(search.eventId));
    }
  },
});

function RouteComponent() {
  return (
    <Suspense fallback={<FullScreenLoading />}>
      <TicketListingForm mode='create' />
    </Suspense>
  );
}
