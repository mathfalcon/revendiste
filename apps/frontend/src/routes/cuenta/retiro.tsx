import {createFileRoute} from '@tanstack/react-router';
import {PayoutsView} from '~/features';
import {z} from 'zod';

const retiroSearchSchema = z.object({
  payoutId: z.string().uuid().optional(),
});

export const Route = createFileRoute('/cuenta/retiro')({
  component: PayoutsView,
  validateSearch: search => retiroSearchSchema.parse(search),
  head: () => ({
    meta: [
      {
        title: 'Payouts | Revendiste',
      },
    ],
  }),
});
