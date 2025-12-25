import {createFileRoute} from '@tanstack/react-router';
import {MyTicketsView} from '~/features';
import {z} from 'zod';

const ticketsSearchSchema = z.object({
  orden: z.string().uuid().optional(),
});

export const Route = createFileRoute('/cuenta/tickets')({
  component: MyTicketsView,
  validateSearch: ticketsSearchSchema,
  head: () => ({
    meta: [
      {
        title: 'Mis Tickets | Revendiste',
      },
    ],
  }),
});
