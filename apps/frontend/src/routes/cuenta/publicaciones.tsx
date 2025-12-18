import {createFileRoute} from '@tanstack/react-router';
import {PublicationsView} from '~/features';
import {z} from 'zod';

const publicacionesSearchSchema = z.object({
  subirTicket: z.string().optional(),
  subirPublicacion: z.string().uuid().optional(),
});

export const Route = createFileRoute('/cuenta/publicaciones')({
  component: PublicationsView,
  validateSearch: publicacionesSearchSchema,
  head: () => ({
    meta: [
      {
        title: 'Mis Publicaciones | Revendiste',
      },
    ],
  }),
});
