import {createFileRoute, redirect} from '@tanstack/react-router';
import {PublicationsView} from '~/features/user-account';
import {z} from 'zod';
import {seo} from '~/utils/seo';

const publicacionesSearchSchema = z.object({
  subirTicket: z.string().optional(),
  subirPublicacion: z.string().uuid().optional(),
  /** @deprecated Usá la ruta `/cuenta/publicaciones/{id}`; se redirige automáticamente. */
  publicacion: z.string().uuid().optional(),
});

export const Route = createFileRoute('/cuenta/publicaciones/')({
  beforeLoad: ({search}) => {
    if (search.publicacion) {
      throw redirect({
        to: '/cuenta/publicaciones/$listingId',
        params: {listingId: search.publicacion},
        search: {
          ...(search.subirTicket ? {subirTicket: search.subirTicket} : {}),
        },
      });
    }
  },
  component: PublicationsView,
  validateSearch: publicacionesSearchSchema,
  head: () => ({
    meta: [
      ...seo({
        title: 'Mis Publicaciones | Revendiste',
        noIndex: true,
      }),
    ],
  }),
});
