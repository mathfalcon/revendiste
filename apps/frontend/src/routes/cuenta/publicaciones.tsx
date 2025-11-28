import {createFileRoute} from '@tanstack/react-router';
import {PublicationsView} from '~/features';
import {z} from 'zod';

const publicacionesSearchSchema = z.object({
  subirTicket: z.string().optional(),
});

export const Route = createFileRoute('/cuenta/publicaciones')({
  component: PublicationsView,
  validateSearch: publicacionesSearchSchema,
});
