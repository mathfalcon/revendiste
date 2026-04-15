import {createFileRoute} from '@tanstack/react-router';
import {SinglePublicationView} from '~/features/user-account';
import {z} from 'zod';
import {seo} from '~/utils/seo';
import {getMyListingByIdQuery} from '~/lib';

const publicationDetailSearchSchema = z.object({
  subirTicket: z.string().optional(),
});

function PublicationDetailRoute() {
  const {listingId} = Route.useParams();
  return <SinglePublicationView listingId={listingId} />;
}

export const Route = createFileRoute('/cuenta/publicaciones/$listingId')({
  component: PublicationDetailRoute,
  validateSearch: publicationDetailSearchSchema,
  loader: ({context, params}) => {
    void context.queryClient.prefetchQuery(
      getMyListingByIdQuery(params.listingId),
    );
  },
  head: () => ({
    meta: [
      ...seo({
        title: 'Publicación | Revendiste',
        noIndex: true,
      }),
    ],
  }),
});
