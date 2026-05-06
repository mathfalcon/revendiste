import {createFileRoute, redirect} from '@tanstack/react-router';
import {PayoutsView} from '~/features/user-account';
import {z} from 'zod';
import {seo} from '~/utils/seo';

const retiroSearchSchema = z.object({
  payoutId: z.string().uuid().optional(),
});

export const Route = createFileRoute('/cuenta/retiro/')({
  component: PayoutsView,
  validateSearch: search => retiroSearchSchema.parse(search),
  beforeLoad: ({search}) => {
    if (search.payoutId) {
      throw redirect({
        to: '/cuenta/retiro/$payoutId',
        params: {payoutId: search.payoutId},
      });
    }
  },
  head: () => ({
    meta: [
      ...seo({
        title: 'Retiros | Revendiste',
        noIndex: true,
      }),
    ],
  }),
});
