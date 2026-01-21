import {SubmitHandler, useFormContext} from 'react-hook-form';
import {useState, useMemo, useCallback, useRef} from 'react';
import {Combobox, TextEllipsis} from '~/components';
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
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  EventTicketCurrency,
  getEventByIdQuery,
  getEventBySearchQuery,
  getMyListingsQuery,
  postTicketListingMutation,
} from '~/lib';
import {format} from 'date-fns';
import {es} from 'date-fns/locale';
import {
  formatPrice,
  calculateSellerAmount,
  calculateMaxResalePrice,
} from '~/utils';
import {Link, useNavigate} from '@tanstack/react-router';
import {Checkbox} from '~/components/ui/checkbox';
import {MobilePublishBar} from './MobilePublishBar';
import {toast} from 'sonner';

interface TicketListingFormProps {
  mode: 'create' | 'edit';
}

export const TicketListingFormRight = ({mode}: TicketListingFormProps) => {
  const form = useFormContext<TicketListingFormValues>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [eventSearchValue, setEventSearchValue] = useState('');
  const debouncedSetEventSearchValue = useDebounceCallback(
    setEventSearchValue,
    500,
  );

  const eventsQuery = useQuery(getEventBySearchQuery(eventSearchValue));
  const eventDetailsQuery = useQuery(getEventByIdQuery(form.watch('eventId')));
  const createTicketListingMutation = useMutation({
    ...postTicketListingMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getMyListingsQuery().queryKey,
      });
      navigate({to: '/cuenta/publicaciones'});
    },
  });

  const onSubmit: SubmitHandler<TicketListingFormValues> = async data => {
    await createTicketListingMutation.mutateAsync({
      eventId: data.eventId,
      ticketWaveId: data.eventTicketWaveId,
      price: data.price,
      quantity: data.quantity,
    });
  };

  const watchEventId = form.watch('eventId');

  const eventsComboboxOptions = useMemo(() => {
    const formatEventDate = (date: Date | string) =>
      format(new Date(date), "d 'de' MMMM 'a las' HH:mm", {locale: es});

    const searchResults =
      eventsQuery.data?.map(event => ({
        value: event.id,
        label: event.name,
        image: event.eventImages[0]?.url,
        date: formatEventDate(event.eventStartDate),
      })) ?? [];

    if (
      watchEventId &&
      eventDetailsQuery.data &&
      !searchResults.find(opt => opt.value === watchEventId)
    ) {
      return [
        {
          value: eventDetailsQuery.data.id,
          label: eventDetailsQuery.data.name,
          image: eventDetailsQuery.data.eventImages[0]?.url,
          date: formatEventDate(eventDetailsQuery.data.eventStartDate),
        },
        ...searchResults,
      ];
    }

    return searchResults;
  }, [eventsQuery.data, eventDetailsQuery.data, watchEventId]);

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

  const watchPrice = form.watch('price');
  const watchQuantity = form.watch('quantity');
  const watchMaxPrice = form.watch('maxPrice');

  // Throttle toast to avoid spamming when user repeatedly exceeds max
  const lastToastTimeRef = useRef<number>(0);
  const showMaxExceededToast = useCallback(
    (maxPrice: number, currency: EventTicketCurrency) => {
      const now = Date.now();
      if (now - lastToastTimeRef.current > 2000) {
        lastToastTimeRef.current = now;
        toast.warning(`El precio máximo es ${formatPrice(maxPrice, currency)}`);
      }
    },
    [],
  );

  const sellerAmountCalculation = useMemo(() => {
    if (!watchPrice || !selectedEventTicketWave?.currency) {
      return null;
    }
    return calculateSellerAmount(watchPrice, selectedEventTicketWave.currency);
  }, [watchPrice, selectedEventTicketWave?.currency]);

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className='space-y-6 md:space-y-8'
    >
      <h1 className='hidden md:block text-2xl font-bold text-right'>
        Publicá tu entrada
      </h1>
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
                  <TextEllipsis className='font-medium' maxLines={2}>
                    {option.label}
                  </TextEllipsis>
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
                // Max resale price is 115% of face value to allow cost recovery
                const maxResalePrice = calculateMaxResalePrice(
                  Number(selectedEventTicketWave.faceValue),
                );
                form.setValue('maxPrice', maxResalePrice, {shouldValidate: true});
                field.onChange(selectedEventTicketWave.id);
              }
            }}
            label='Tipo de entrada'
            placeholder='Selecciona el tipo de entrada'
            searchPlaceholder='Buscar tipo...'
            emptyMessage='No se encontraron tipos de entrada'
            description='Selecciona el tipo de entrada que quieres vender'
            options={eventTicketWaveComboboxOptions}
            renderSelectedValue={option => {
              if (!option) return null;
              return (
                <span className='flex items-center gap-2'>
                  <span>{option.label}</span>
                  {option.price && (
                    <span className='text-muted-foreground'>
                      {formatPrice(option.price, option.currency)}
                    </span>
                  )}
                </span>
              );
            }}
            renderOption={(option, isSelected) => (
              <div className='flex items-center justify-between w-full'>
                <div className='flex-1'>
                  <div className='font-medium'>{option.label}</div>
                  {option.price && (
                    <div className='text-sm text-muted-foreground'>
                      {formatPrice(option.price, option.currency)}
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
            disabled={!watchEventId || eventTicketWaveComboboxOptions.length === 0}
          />
        )}
      />

      <FormField
        control={form.control}
        name='price'
        render={({field}) => {
          const currency =
            selectedEventTicketWave?.currency ?? EventTicketCurrency.UYU;
          const isDisabled = !watchEventId || !watchEventTicketWaveId;
          const maxPrice = watchMaxPrice;

          const handleMaxExceeded = () => {
            if (maxPrice) {
              showMaxExceededToast(maxPrice, currency);
            }
          };

          return (
            <FormItem>
              <FormLabel>Precio de venta</FormLabel>
              <FormControl>
                <PriceInput
                  placeholder='Ingresá el precio'
                  value={field.value}
                  onChange={field.onChange}
                  locale='es-ES'
                  currency={currency}
                  disabled={isDisabled}
                  max={maxPrice}
                  onMaxExceeded={handleMaxExceeded}
                />
              </FormControl>
              <FormDescription>
                {maxPrice
                  ? `Máximo: ${formatPrice(maxPrice, currency)}. `
                  : 'Máximo 15% sobre el valor original. '}
                <Link
                  to='/preguntas-frecuentes'
                  search={{seccion: 'general', pregunta: 2}}
                  className='text-primary hover:underline'
                  target='_blank'
                >
                  ¿Por qué?
                </Link>
              </FormDescription>
              <FormMessage />
            </FormItem>
          );
        }}
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
                  value={field.value || ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '') {
                      field.onChange(0);
                    } else {
                      // Parse as integer to remove leading zeros, clamp to max 10
                      const num = Math.min(parseInt(val, 10) || 0, 10);
                      field.onChange(num);
                    }
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  min={1}
                  max={10}
                  disabled={!watchEventId || !watchEventTicketWaveId}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <FormField
        control={form.control}
        name='acceptTerms'
        render={({field}) => (
          <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className='space-y-1 leading-none'>
              <FormLabel className='text-sm font-normal'>
                Acepto los{' '}
                <Link
                  to='/terminos-y-condiciones'
                  className='text-primary underline hover:no-underline'
                  target='_blank'
                  rel='noopener noreferrer'
                  resetScroll
                >
                  términos de servicio
                </Link>
              </FormLabel>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />

      {/* Desktop Submit Button */}
      <Button
        type='submit'
        className='w-full hidden md:flex'
        disabled={form.formState.isSubmitting}
      >
        {mode === 'create' ? 'Publicar' : 'Actualizar'}
      </Button>

      {/* Mobile Sticky Publish Bar */}
      {!!watchPrice &&
        !!selectedEventTicketWave?.currency &&
        !!sellerAmountCalculation && (
          <MobilePublishBar
            price={watchPrice}
            quantity={watchQuantity}
            currency={selectedEventTicketWave.currency}
            sellerAmountCalculation={sellerAmountCalculation}
            isPending={form.formState.isSubmitting}
          />
        )}
    </form>
  );
};
