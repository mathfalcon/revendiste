import {useForm} from 'react-hook-form';
import z from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {Form} from '~/components/ui/form';
import {TicketListingFormLeft} from './TicketListingFormLeft';
import {TicketListingFormRight} from './TicketListingFormRight';
import {useEffect, useState, useRef} from 'react';
import {useQuery} from '@tanstack/react-query';
import {EventImageType, getEventByIdQuery} from '~/lib';
import defaultHeroImage from '~/assets/backgrounds/homepage.png?url';
import {FullScreenLoading} from '~/components';

interface TicketListingFormProps {
  mode: 'create' | 'edit';
  initialEventId?: string;
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
    acceptTerms: z
      .boolean()
      .default(false)
      .refine(val => val === true, {
        message: 'Debes aceptar los términos de servicio para continuar',
      }),
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

export const TicketListingForm = ({
  mode,
  initialEventId,
}: TicketListingFormProps) => {
  const form = useForm({
    resolver: zodResolver(TicketListingFormSchema),
    defaultValues: {
      eventId: initialEventId ?? '',
      quantity: 1,
      acceptTerms: false,
    },
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const watchEventId = form.watch('eventId');
  const eventDetailsQuery = useQuery(getEventByIdQuery(watchEventId));

  useEffect(() => {
    if (initialEventId) {
      form.setValue('eventId', initialEventId);
    }
  }, [initialEventId, form]);

  const event = eventDetailsQuery.data;
  const heroImage = event?.eventImages.find(
    i => i.imageType === EventImageType.Hero,
  );
  const src = heroImage?.url ?? defaultHeroImage;

  return (
    <Form {...form}>
      <div className='md:hidden relative w-full min-h-[15vh] bg-muted'>
        <img
          key={src}
          ref={imgRef}
          src={src}
          alt='Event cover'
          decoding='async'
          loading='eager'
          className='w-full h-full max-h-[15vh] object-cover transition-opacity duration-300'
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none' />
        <div className='absolute bottom-0 left-0 right-0 p-4'>
          <h1 className='text-2xl font-bold text-white drop-shadow-lg'>
            Publicá tu entrada
          </h1>
        </div>
      </div>

      <div className='container mx-auto py-4 md:py-6 px-4 md:px-0'>
        <div className='flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-10'>
          <div className='hidden md:block'>
            <TicketListingFormLeft />
          </div>
          <div className='w-full'>
            <TicketListingFormRight mode={mode} />
          </div>
        </div>
        <div className='md:hidden mt-6'>
          <TicketListingFormLeft />
        </div>
      </div>
    </Form>
  );
};
