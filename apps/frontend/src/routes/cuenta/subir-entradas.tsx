import {createFileRoute} from '@tanstack/react-router';
import {UploadTicketsView} from '~/features/user-account';
import {z} from 'zod';

const subirTicketsSearchSchema = z.object({
  subirTicket: z.string().optional(),
  subirPublicacion: z.string().uuid().optional(),
});

export const Route = createFileRoute('/cuenta/subir-entradas')({
  component: UploadTicketsView,
  validateSearch: subirTicketsSearchSchema,
  head: () => ({
    meta: [
      {
        title: 'Subir Entradas | Revendiste',
      },
    ],
  }),
});
