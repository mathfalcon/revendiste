import {SubmitHandler, useFormContext} from 'react-hook-form';
import {useState, useMemo} from 'react';
import {Combobox} from '~/components';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import {Input} from '~/components/ui/input';
import {PriceInput} from '~/components/ui/price-input';
import {Button} from '~/components/ui/button';
import {Check} from 'lucide-react';
import {cn} from '~/lib/utils';
import {TicketListingFormValues} from './TicketListingForm';
import {useDebounceCallback} from 'usehooks-ts';
import {useMutation, useQuery} from '@tanstack/react-query';
import {
  EventTicketCurrency,
  getEventByIdQuery,
  getEventBySearchQuery,
  postTicketListingMutation,
} from '~/lib';
import {format} from 'date-fns';
import {es} from 'date-fns/locale';
import {getCurrencySymbol} from '~/utils';

interface TicketListingFormProps {
  mode: 'create' | 'edit';
}

export const TicketListingFormRight = ({mode}: TicketListingFormProps) => {
  const form = useFormContext<TicketListingFormValues>();
  const [eventSearchValue, setEventSearchValue] = useState('');
  const debouncedSetEventSearchValue = useDebounceCallback(
    setEventSearchValue,
    500,
  );

  const eventsQuery = useQuery(getEventBySearchQuery(eventSearchValue));
  const eventDetailsQuery = useQuery(getEventByIdQuery(form.watch('eventId')));
  const createTicketListingMutation = useMutation(postTicketListingMutation());

  const onSubmit: SubmitHandler<TicketListingFormValues> = async data => {
    await createTicketListingMutation.mutateAsync({
      eventId: data.eventId,
      ticketWaveId: data.eventTicketWaveId,
      price: data.price,
      quantity: data.quantity,
    });
  };

  const eventsComboboxOptions = useMemo(() => {
    return (
      eventsQuery.data?.map(event => ({
        value: event.id,
        label: event.name,
        image: event.eventImages[0]?.url,
        date: format(event.eventStartDate, 'dd MMMM, yyyy', {locale: es}),
      })) ?? []
    );
  }, [eventsQuery.data]);

  const eventTicketWaveComboboxOptions = useMemo(() => {
    return (
      eventDetailsQuery.data?.ticketWaves.map(ticketWave => ({
        value: ticketWave.id,
        label: ticketWave.name,
        price: ticketWave.faceValue,
        currency: ticketWave.currency,
      })) ?? []
    );
  }, [eventDetailsQuery.data]);

  const watchEventTicketWaveId = form.watch('eventTicketWaveId');

  const selectedEventTicketWave = useMemo(() => {
    return eventDetailsQuery.data?.ticketWaves.find(
      ticketWave => ticketWave.id === watchEventTicketWaveId,
    );
  }, [eventDetailsQuery.data, watchEventTicketWaveId]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8 '>
      <h1 className='text-2xl font-bold text-right'>Publicá tu entrada</h1>
      <FormField
        control={form.control}
        name='eventId'
        render={({field}) => (
          <Combobox
            value={field.value}
            onValueChange={newValue => {
              field.onChange(newValue);
              form.resetField('eventTicketWaveId');
            }}
            label='Evento'
            placeholder='Selecciona un evento'
            searchPlaceholder='Buscar evento...'
            emptyMessage='No se encontraron eventos'
            description='Selecciona el evento al cual pertenece tu entrada'
            options={eventsComboboxOptions}
            renderOption={(option, isSelected) => (
              <div className='flex items-center gap-3 w-full'>
                <img
                  src={option.image}
                  alt={option.label}
                  className='w-12 h-12 rounded-md object-cover flex-shrink-0'
                />
                <div className='flex-1 text-left'>
                  <div className='font-medium'>{option.label}</div>
                  <div className='text-sm text-muted-foreground'>
                    {option.date}
                  </div>
                </div>
                <Check
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    isSelected ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </div>
            )}
            onSearchValueChange={debouncedSetEventSearchValue}
            isLoading={eventsQuery.isFetching}
          />
        )}
      />

      <FormField
        control={form.control}
        name='eventTicketWaveId'
        render={({field}) => (
          <Combobox
            value={field.value}
            onValueChange={newValue => {
              const selectedEventTicketWave =
                eventDetailsQuery.data?.ticketWaves.find(
                  ticketWave => ticketWave.id === newValue,
                );
              if (selectedEventTicketWave) {
                form.setValue(
                  'maxPrice',
                  Number(selectedEventTicketWave?.faceValue),
                  {shouldValidate: true},
                );
                field.onChange(selectedEventTicketWave.id);
              }
            }}
            label='Tipo de entrada'
            placeholder='Selecciona el tipo de entrada'
            searchPlaceholder='Buscar tipo...'
            emptyMessage='No se encontraron tipos de entrada'
            description='Selecciona el tipo de entrada que quieres vender'
            options={eventTicketWaveComboboxOptions}
            renderOption={(option, isSelected) => (
              <div className='flex items-center justify-between w-full'>
                <div className='flex-1'>
                  <div className='font-medium'>{option.label}</div>
                  {option.price && (
                    <div className='text-sm text-muted-foreground'>
                      {getCurrencySymbol(option.currency)}
                      {option.price.toLocaleString()}
                    </div>
                  )}
                </div>
                <Check
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    isSelected ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </div>
            )}
            disabled={eventTicketWaveComboboxOptions.length === 0}
          />
        )}
      />

      <FormField
        control={form.control}
        name='price'
        render={({field}) => (
          <FormItem>
            <FormLabel>Precio de venta</FormLabel>
            <FormControl>
              <PriceInput
                placeholder='Ingresa el precio'
                value={field.value}
                onChange={field.onChange}
                locale='es-ES'
                currency={
                  selectedEventTicketWave?.currency ?? EventTicketCurrency.UYU
                }
              />
            </FormControl>
            <FormDescription>
              No debe superar el precio original de la entrada
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='quantity'
        render={({field}) => {
          return (
            <FormItem>
              <FormLabel>Cantidad</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  placeholder='Ingresa la cantidad'
                  {...field}
                  onChange={e =>
                    field.onChange(
                      e.target.value === '' ? 0 : Number(e.target.value),
                    )
                  }
                  min={1}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          );
        }}
      />

      <Button
        type='submit'
        className='w-full'
        disabled={form.formState.isSubmitting}
      >
        {mode === 'create' ? 'Publicar' : 'Actualizar'}
      </Button>
    </form>
  );
};
