import {Suspense} from 'react';
import z from 'zod';
import {FullScreenLoading} from '~/components';
import {TicketListingForm} from '~/features/ticket-listing';
import {createFileRoute, useSearch} from '@tanstack/react-router';
import {beforeLoadRedirectToSignInIfNotAuthenticated} from '~/utils/auth';
import {getEventByIdQuery} from '~/lib';

const CreateTicketListingSearchSchema = z.object({
  eventoId: z.uuid().optional(),
});

export const Route = createFileRoute('/entradas/publicar')({
  component: RouteComponent,
  validateSearch: search => CreateTicketListingSearchSchema.parse(search),
  beforeLoad: ({context, location}) => {
    beforeLoadRedirectToSignInIfNotAuthenticated(context.userId, location);
  },
  loaderDeps: ({search: {eventoId}}) => ({eventoId}),
  loader: async ({context, deps: {eventoId}}) => {
    // Prefetch event data for the form if eventId is provided in search params
    if (eventoId) {
      await context.queryClient.ensureQueryData(getEventByIdQuery(eventoId));
    }
  },
  head: () => ({
    meta: [
      {
        title: 'Publicar Entradas | Revendiste',
      },
    ],
  }),
});

function RouteComponent() {
  const {eventoId} = useSearch({from: '/entradas/publicar'});
  return (
    <Suspense fallback={<FullScreenLoading />}>
      <TicketListingForm mode='create' initialEventId={eventoId} />
    </Suspense>
  );
}
