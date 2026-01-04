import {createFileRoute} from '@tanstack/react-router';
import {PublicationsView} from '~/features';
import {z} from 'zod';
import {seo} from '~/utils/seo';

const publicacionesSearchSchema = z.object({
  subirTicket: z.string().optional(),
  subirPublicacion: z.string().uuid().optional(),
});

export const Route = createFileRoute('/cuenta/publicaciones')({
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
