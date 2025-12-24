import {createFileRoute} from '@tanstack/react-router';
import {PayoutsView} from '~/features';

export const Route = createFileRoute('/cuenta/retiro')({
  component: PayoutsView,
  head: () => ({
    meta: [
      {
        title: 'Payouts | Revendiste',
      },
    ],
  }),
});
