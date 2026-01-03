import {useQuery} from '@tanstack/react-query';
import {useFormContext} from 'react-hook-form';
import {CDN_ASSETS, SingleTicketLogo} from '~/assets';
import {Separator} from '~/components/ui/separator';
import {EventImageType, getEventByIdQuery} from '~/lib';
import {TicketListingFormValues} from './TicketListingForm';
import {PageLoading, TextEllipsis} from '~/components';
import {formatEventDate, formatPrice, calculateSellerAmount} from '~/utils';
import {useMemo} from 'react';
import {cn} from '~/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';

export const TicketListingFormLeft = () => {
  const form = useFormContext<TicketListingFormValues>();
  const eventDetailsQuery = useQuery(getEventByIdQuery(form.watch('eventId')));

  const [watchEventTicketWaveId, watchPrice] = form.watch([
    'eventTicketWaveId',
    'price',
  ]);

  const selectedEventTicketWave = useMemo(() => {
    return eventDetailsQuery.data?.ticketWaves.find(
      ticketWave => ticketWave.id === watchEventTicketWaveId,
    );
  }, [eventDetailsQuery.data, watchEventTicketWaveId]);

  const sellerAmountCalculation = useMemo(() => {
    if (!watchPrice || !selectedEventTicketWave?.currency) {
      return null;
    }
    return calculateSellerAmount(watchPrice, selectedEventTicketWave.currency);
  }, [watchPrice, selectedEventTicketWave?.currency]);

  const eventDetails = eventDetailsQuery.data;

  const heroImage = eventDetails?.eventImages.find(
    image => image.imageType === EventImageType.Hero,
  );

  const isLoading = eventDetailsQuery.isLoading;
  const eventStartDate = eventDetails?.eventStartDate;

  return (
    <>
      <div className='hidden md:flex relative items-center justify-center flex-col bg-background h-fit rounded-2xl overflow-hidden shadow-md'>
        <div className='relative w-full h-[236px] overflow-hidden bg-background'>
          {isLoading ? (
            <PageLoading />
          ) : (
            <>
              {/* Blurred background */}
              <img
                src={heroImage?.url ?? CDN_ASSETS.HOMEPAGE_BG_1}
                alt=''
                className='absolute inset-0 h-full w-full object-cover blur-[5px] scale-110 z-0'
                aria-hidden='true'
                loading='lazy'
                decoding='async'
              />
              {/* Foreground image */}
              <img
                src={heroImage?.url ?? CDN_ASSETS.HOMEPAGE_BG_1}
                alt='Hero'
                className={cn('relative z-10 h-full w-full object-contain', {
                  ['object-cover']: !heroImage?.url,
                })}
                loading='lazy'
                decoding='async'
              />
            </>
          )}
        </div>
        <div className='px-8 py-4 grid grid-cols-2 gap-4 w-full relative'>
          <Separator className='col-span-2' />
          <SingleTicketLogo className='absolute opacity-[2.5%] rotate-45 top-[65%] right-[5%]' />
          <div>
            <h2 className='font-bold text-muted-foreground'>Evento:</h2>
            <span>{eventDetails?.name ?? '—'}</span>
          </div>
          <div>
            <h2 className='font-bold text-muted-foreground'>Fecha</h2>
            <span>
              {eventStartDate ? formatEventDate(new Date(eventStartDate)) : '—'}
            </span>
          </div>
          <div>
            <h2 className='font-bold text-muted-foreground'>Lugar</h2>
            <TextEllipsis maxLines={2}>
              {(eventDetails?.venueName
                ? `${eventDetails.venueName} - ${eventDetails.venueAddress}`
                : eventDetails?.venueAddress) ?? '—'}
            </TextEllipsis>
          </div>
          <div>
            <h2 className='font-bold text-muted-foreground'>Tipo de entrada</h2>
            <span>{selectedEventTicketWave?.name ?? '—'}</span>
          </div>
          <div className='col-span-2'>
            <h2 className='font-bold text-muted-foreground '>
              Precio de publicación
            </h2>
            <span>
              {watchPrice
                ? `${formatPrice(watchPrice, selectedEventTicketWave?.currency)} por entrada`
                : '—'}
            </span>
          </div>
          <div className='col-span-2'>
            <h2 className='font-bold text-primary'>Recibirás*</h2>
            <span>
              {sellerAmountCalculation
                ? `${formatPrice(sellerAmountCalculation.sellerAmount, sellerAmountCalculation.currency)} por entrada`
                : '—'}
            </span>
          </div>
          <div className='col-span-2'>
            <h2 className='font-bold text-muted-foreground'>
              Metodo de entrega**
            </h2>
            <span>
              Deberás subir el QR de tu entrada al sistema 48 horas antes del
              evento**
            </span>
          </div>
          <Separator className='col-span-2' />
          <div className='col-span-2 text-muted-foreground text-xs opacity-50 flex flex-col gap-2'>
            <p>
              * El dinero de tus entradas será retenido por nuestra plataforma y
              estará disponible para retiro 3 días hábiles después de finalizado
              el evento. Este plazo nos permite verificar que no existan
              inconvenientes o reclamos relacionados con el uso de la entrada.
              Si no se presentan problemas, el monto se liberará automáticamente
              y podrás retirarlo. En caso de que surja un reclamo, el pago
              permanecerá retenido hasta que la situación quede resuelta.
              <br />
              <br />
              <strong>Cálculo de comisiones:</strong> Aplicamos una comisión del
              6% sobre el precio de venta, más el IVA (22%) sobre dicha
              comisión.
            </p>

            <p>
              ** Es obligatorio subir el código QR de la entrada a la plataforma
              al menos 48 horas antes del evento. Si no cumples con la entrega
              en el formato y plazo indicados, la venta será cancelada y podrás
              recibir sanciones.
            </p>
          </div>
        </div>
      </div>

      <div className='md:hidden bg-background rounded-lg border p-4'>
        <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='summary' className='border-none'>
            <AccordionTrigger className='py-2 hover:no-underline'>
              <div className='flex flex-col items-start gap-1'>
                <h3 className='font-semibold text-base'>
                  Resumen de publicación
                </h3>
                {watchPrice && sellerAmountCalculation && (
                  <p className='text-sm text-muted-foreground font-normal'>
                    Recibirás:{' '}
                    {formatPrice(
                      sellerAmountCalculation.sellerAmount,
                      sellerAmountCalculation.currency,
                    )}{' '}
                    por entrada
                  </p>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className='pt-4 space-y-4'>
              {isLoading ? (
                <PageLoading />
              ) : (
                <>
                  {eventDetails && (
                    <div className='space-y-3'>
                      <div>
                        <h4 className='text-sm font-semibold text-muted-foreground mb-1'>
                          Evento
                        </h4>
                        <p className='text-sm'>{eventDetails.name}</p>
                      </div>
                      {eventStartDate && (
                        <div>
                          <h4 className='text-sm font-semibold text-muted-foreground mb-1'>
                            Fecha
                          </h4>
                          <p className='text-sm'>
                            {formatEventDate(new Date(eventStartDate))}
                          </p>
                        </div>
                      )}
                      {eventDetails.venueName || eventDetails.venueAddress ? (
                        <div>
                          <h4 className='text-sm font-semibold text-muted-foreground mb-1'>
                            Lugar
                          </h4>
                          <p className='text-sm'>
                            {eventDetails.venueName
                              ? `${eventDetails.venueName} - ${eventDetails.venueAddress}`
                              : eventDetails.venueAddress}
                          </p>
                        </div>
                      ) : null}
                      {selectedEventTicketWave && (
                        <div>
                          <h4 className='text-sm font-semibold text-muted-foreground mb-1'>
                            Tipo de entrada
                          </h4>
                          <p className='text-sm'>
                            {selectedEventTicketWave.name}
                          </p>
                        </div>
                      )}
                      {watchPrice && selectedEventTicketWave && (
                        <div>
                          <h4 className='text-sm font-semibold text-muted-foreground mb-1'>
                            Precio de publicación
                          </h4>
                          <p className='text-sm'>
                            {formatPrice(
                              watchPrice,
                              selectedEventTicketWave.currency,
                            )}{' '}
                            por entrada
                          </p>
                        </div>
                      )}
                      {sellerAmountCalculation && (
                        <div>
                          <h4 className='text-sm font-semibold text-primary mb-1'>
                            Recibirás*
                          </h4>
                          <p className='text-sm font-medium'>
                            {formatPrice(
                              sellerAmountCalculation.sellerAmount,
                              sellerAmountCalculation.currency,
                            )}{' '}
                            por entrada
                          </p>
                        </div>
                      )}
                      <Separator />
                      <div className='text-xs text-muted-foreground space-y-2'>
                        <p>
                          * El dinero será retenido por nuestra plataforma y
                          estará disponible para retiro 3 días hábiles después
                          del evento.
                        </p>
                        <p>
                          ** Deberás subir el QR de tu entrada al sistema 48
                          horas antes del evento.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  );
};
