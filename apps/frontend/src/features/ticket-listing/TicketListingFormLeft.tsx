import {useQuery} from '@tanstack/react-query';
import {useFormContext} from 'react-hook-form';
import {CDN_ASSETS, SingleTicketLogo} from '~/assets';
import {Separator} from '~/components/ui/separator';
import {EventImageType, getEventByIdQuery} from '~/lib';
import {TicketListingFormValues} from './TicketListingForm';
import {PageLoading, TextEllipsis} from '~/components';
import {
  formatEventDate,
  formatPrice,
  calculateSellerAmount,
  getFeeRates,
} from '~/utils';
import {useMemo, useState} from 'react';
import {cn} from '~/lib/utils';
import {
  QrAvailabilityDialog,
  QR_TIMING_LABELS,
} from '~/features/event/QrAvailabilityDialog';
import {Info, Clock} from 'lucide-react';
import {Alert, AlertDescription} from '~/components/ui/alert';
import {Button} from '~/components/ui/button';
import {Link} from '@tanstack/react-router';

export const TicketListingFormLeft = () => {
  const feeRates = getFeeRates();
  const form = useFormContext<TicketListingFormValues>();
  const eventDetailsQuery = useQuery(getEventByIdQuery(form.watch('eventId')));
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  const [watchEventTicketWaveId, watchPrice, watchQuantity] = form.watch([
    'eventTicketWaveId',
    'price',
    'quantity',
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
          {/* Payment Breakdown */}
          {sellerAmountCalculation ? (
            <div className='col-span-2 space-y-2'>
              <div className='flex justify-between items-center'>
                <span className='text-muted-foreground'>Precio por entrada</span>
                <span className='font-medium'>
                  {formatPrice(watchPrice, selectedEventTicketWave?.currency)}
                </span>
              </div>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-muted-foreground'>
                  Comisión ({feeRates.platformCommissionPercentage}%)
                </span>
                <span className='text-muted-foreground'>
                  -{formatPrice(sellerAmountCalculation.platformCommission, sellerAmountCalculation.currency)}
                </span>
              </div>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-muted-foreground'>
                  IVA sobre comisión ({feeRates.vatPercentage}%)
                </span>
                <span className='text-muted-foreground'>
                  -{formatPrice(sellerAmountCalculation.vatOnCommission, sellerAmountCalculation.currency)}
                </span>
              </div>
              <Separator />
              <div className='flex justify-between items-center'>
                <span className='font-bold text-primary'>Recibirás por entrada*</span>
                <span className='font-bold text-primary'>
                  {formatPrice(sellerAmountCalculation.sellerAmount, sellerAmountCalculation.currency)}
                </span>
              </div>
              {watchQuantity > 1 && (
                <div className='flex justify-between items-center pt-2 border-t'>
                  <span className='font-semibold'>
                    Total ({watchQuantity} entradas)
                  </span>
                  <span className='font-bold text-lg'>
                    {formatPrice(sellerAmountCalculation.sellerAmount * watchQuantity, sellerAmountCalculation.currency)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className='col-span-2'>
                <h2 className='font-bold text-muted-foreground'>
                  Precio de publicación
                </h2>
                <span>—</span>
              </div>
              <div className='col-span-2'>
                <h2 className='font-bold text-primary'>Recibirás*</h2>
                <span>—</span>
              </div>
            </>
          )}
          {eventDetails?.qrAvailabilityTiming && (
            <div className='col-span-2'>
              <h2 className='font-bold text-muted-foreground'>
                Método de entrega**
              </h2>
              <span>
                Deberás subir el QR de tu entrada al sistema{' '}
                <button
                  type='button'
                  onClick={() => setQrDialogOpen(true)}
                  className='inline-flex items-center gap-1 text-primary underline underline-offset-2 hover:text-primary/80'
                >
                  {QR_TIMING_LABELS[eventDetails.qrAvailabilityTiming]}
                  <Info className='h-3.5 w-3.5' />
                </button>{' '}
                antes del evento
              </span>
            </div>
          )}
          <Separator className='col-span-2' />
          <div className='col-span-2 text-muted-foreground text-xs opacity-50 flex flex-col gap-2'>
            <p>
              * El dinero de tus entradas será retenido por nuestra plataforma
              como parte de la{' '}
              <Link
                to='/garantia'
                className='text-primary underline hover:no-underline'
              >
                Garantía Revendiste
              </Link>
              , y estará disponible para retiro 48 horas después de finalizado
              el evento. Si surge un reclamo, el pago permanecerá retenido hasta
              que la situación quede resuelta.
            </p>

            <p>
              ** Es obligatorio subir el código QR de la entrada a la plataforma
              en el plazo indicado. Si no cumples con la entrega, la venta será
              cancelada.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile: QR Upload Info Alert - Always visible when event is selected */}
      {eventDetails?.qrAvailabilityTiming && (
        <Alert className='md:hidden bg-background'>
          <Clock className='h-4 w-4' />
          <AlertDescription className='flex items-center justify-between gap-2'>
            <span className='text-sm'>
              Deberás subir el QR{' '}
              <strong>
                {QR_TIMING_LABELS[eventDetails.qrAvailabilityTiming]}
              </strong>{' '}
              antes del evento
            </span>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='shrink-0 h-7 px-2'
              onClick={() => setQrDialogOpen(true)}
            >
              <Info className='h-4 w-4' />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* QR Availability Info Dialog */}
      {eventDetails?.qrAvailabilityTiming && (
        <QrAvailabilityDialog
          open={qrDialogOpen}
          onOpenChange={setQrDialogOpen}
          qrAvailabilityTiming={eventDetails.qrAvailabilityTiming}
          viewMode='seller'
        />
      )}
    </>
  );
};
