import {createFileRoute} from '@tanstack/react-router';
import {MyTicketsView} from '~/features';

export const Route = createFileRoute('/cuenta/tickets')({
  component: MyTicketsView,
  head: () => ({
    meta: [
      {
        title: 'Mis Tickets | Revendiste',
      },
    ],
  }),
});
