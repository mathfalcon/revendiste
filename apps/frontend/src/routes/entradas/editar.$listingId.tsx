import {createFileRoute, useParams} from '@tanstack/react-router';
import {Suspense} from 'react';
import z from 'zod';
import {FullScreenLoading} from '~/components';
import {TicketListingForm} from '~/features/ticket-listing';

const EditTicketListingSearchSchema = z.object({
  eventId: z.uuid().optional(),
});

export const Route = createFileRoute('/entradas/editar/$listingId')({
  component: RouteComponent,
  validateSearch: search => EditTicketListingSearchSchema.parse(search),
  loaderDeps: ({search: {eventId}}) => ({eventId}),
  loader: ({deps: {eventId}}) => {
    // Prefetch event data for the form if eventId is provided in search params
    if (eventId) {
      // void context.queryClient.prefetchQuery(getEventByIdQuery(search.eventId));
    }
  },
});

function RouteComponent() {
  const params = useParams({
    from: '/entradas/editar/$listingId',
  });

  // TODO: Fetch listing data and pass as initialData
  const initialData = {
    // Add other listing data when available
  };

  return (
    <Suspense fallback={<FullScreenLoading />}>
      <TicketListingForm mode='edit' initialData={initialData} />
    </Suspense>
  );
}
