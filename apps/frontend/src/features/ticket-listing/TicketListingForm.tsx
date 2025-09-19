import {useForm} from 'react-hook-form';
import z from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {Form} from '~/components/ui/form';
import {TicketListingFormLeft} from './TicketListingFormLeft';
import {TicketListingFormRight} from './TicketListingFormRight';

interface TicketListingFormProps {
  mode: 'create' | 'edit';
}

const TicketListingFormSchema = z
  .object({
    eventId: z.string('Requerido').nonempty('Requerido'),
    eventTicketWaveId: z.string('Requerido').nonempty('Requerido'),
    maxPrice: z.number('Requerido'),
    price: z.number('Requerido').min(1, 'El precio deber ser mayor a 0'),
    quantity: z
      .number('Requerido')
      .min(1, 'La cantidad deber ser mayor a 0')
      .max(10, 'La cantidad no puede ser mayor a 10'),
    acceptTerms: z.boolean().default(false),
  })
  .check(ctx => {
    if (ctx.value.price > ctx.value.maxPrice) {
      ctx.issues.push({
        code: 'custom',
        message: `El precio no puede superar al precio original de la tanda ($${ctx.value.maxPrice.toLocaleString('es-ES')})`,
        input: ctx.value,
        path: ['price'],
      });
    }
  });

export type TicketListingFormValues = z.infer<typeof TicketListingFormSchema>;

export const TicketListingForm = ({mode}: TicketListingFormProps) => {
  const form = useForm({
    resolver: zodResolver(TicketListingFormSchema),
    defaultValues: {
      quantity: 1,
      acceptTerms: false,
    },
  });

  return (
    <Form {...form}>
      <div
        className='container mx-auto py-6 grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-center'
        style={{
          height: 'calc(100dvh - var(--navbar-height))',
        }}
      >
        <TicketListingFormLeft />
        <TicketListingFormRight mode={mode} />
      </div>
    </Form>
  );
};
