import {Suspense, useEffect, useRef, useState} from 'react';
import {useSuspenseQuery, useMutation} from '@tanstack/react-query';
import {useNavigate} from '@tanstack/react-router';
import {toast} from 'sonner';
import {
  getOrderByIdQuery,
  EventTicketCurrency,
  createPaymentLinkMutation,
} from '~/lib';
import {
  formatPrice,
  formatEventDate,
  getOrderStatusLabel,
  getEventDisplayImage,
} from '~/utils';
import {useCountdown} from '~/hooks';
import {Button} from '~/components/ui/button';
import {Alert, AlertDescription, AlertTitle} from '~/components/ui/alert';
import {Popover, PopoverContent, PopoverTrigger} from '~/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command';
import {Label} from '~/components/ui/label';
import {
  InfoIcon,
  ClockIcon,
  X,
  Ticket,
  Calendar,
  MapPin,
  ChevronsUpDown,
  Check,
} from 'lucide-react';
import {
  FullScreenLoading,
  CopyableText,
  StickyBottomBar,
  CancelOrderDialog,
  TextEllipsis,
} from '~/components';
import {TicketWaveCard} from '~/features/event/tickets';

/** Americas only (dLocal Go). ISO 3166-1 alpha-2 → label. Sorted by label. */
const CHECKOUT_COUNTRIES: Array<{value: string; label: string}> = [
  {value: 'AR', label: 'Argentina'},
  {value: 'BO', label: 'Bolivia'},
  {value: 'BR', label: 'Brasil'},
  {value: 'CL', label: 'Chile'},
  {value: 'CO', label: 'Colombia'},
  {value: 'CR', label: 'Costa Rica'},
  {value: 'EC', label: 'Ecuador'},
  {value: 'GT', label: 'Guatemala'},
  {value: 'MX', label: 'México'},
  {value: 'PA', label: 'Panamá'},
  {value: 'PY', label: 'Paraguay'},
  {value: 'PE', label: 'Perú'},
  {value: 'UY', label: 'Uruguay'},
];

interface CheckoutPageProps {
  orderId: string;
}

export const CheckoutPage = ({orderId}: CheckoutPageProps) => {
  const order = useSuspenseQuery(getOrderByIdQuery(orderId)).data;
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [payerCountry, setPayerCountry] = useState<string>('UY');
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);

  const countdown = useCountdown(
    order.reservationExpiresAt ? new Date(order.reservationExpiresAt) : null,
  );

  const createPaymentLink = useMutation({
    ...createPaymentLinkMutation(orderId),
    onSuccess: data => {
      // Set redirecting state before navigation
      setIsRedirecting(true);
      // Redirect to payment page
      navigate({href: data.redirectUrl});
    },
    onError: err => {
      toast.error(
        'Error al crear el link de pago. Por favor intenta nuevamente.',
      );
    },
  });

  const currency = order.items[0]!.currency!;
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownToastRef = useRef(false);

  // Function to handle immediate redirect (clears timeout and navigates)
  const handleImmediateRedirect = () => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
    if (order.eventId) {
      navigate({
        to: '/eventos/$eventId',
        params: {eventId: order.eventId},
      });
    }
  };

  // Redirect to event page if booking is expired (with toast notification)
  useEffect(() => {
    if (countdown.isExpired && order.eventId && !hasShownToastRef.current) {
      hasShownToastRef.current = true;

      // Show toast notification with action button
      toast.error('Tu reserva ha expirado', {
        description: 'Serás redirigido al evento en unos segundos...',
        duration: 7000,
        action: {
          label: 'Ir ahora',
          onClick: handleImmediateRedirect,
        },
      });

      // Redirect after 7 seconds (middle of 5-10 seconds range)
      redirectTimeoutRef.current = setTimeout(() => {
        navigate({
          to: '/eventos/$eventId',
          params: {eventId: order.eventId},
        });
      }, 7000);
    }

    // Cleanup timeout on unmount
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [countdown.isExpired, order.eventId, navigate]);

  const eventWithImages = order.event as typeof order.event & {
    images?: Array<{imageType: string; url: string}>;
  };
  const displayImage = getEventDisplayImage(eventWithImages?.images);

  const isButtonDisabled =
    countdown.isExpired || createPaymentLink.isPending || isRedirecting;

  const getButtonText = () => {
    if (countdown.isExpired) return 'Reserva expirada';
    if (isRedirecting) return 'Redirigiendo...';
    if (createPaymentLink.isPending) return 'Creando link de pago...';
    return 'Continuar con el pago';
  };

  return (
    <Suspense fallback={<FullScreenLoading />}>
      {/* Add padding at bottom on mobile to account for sticky bar */}
      <div className='container mx-auto px-2 py-4 sm:py-6 pb-24 md:pb-6'>
        <div className='max-w-3xl mx-auto space-y-4 sm:space-y-6'>
          {/* Header */}
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold mb-1 sm:mb-2'>
              Checkout
            </h1>
            <p className='text-sm sm:text-base text-muted-foreground'>
              Completa el pago para confirmar tu reserva
            </p>
          </div>

          {/* Reservation Timer Alert */}
          {!countdown.isExpired && (
            <Alert className='border-orange-500/30 bg-orange-500/5 hidden sm:block'>
              <ClockIcon className='h-4 w-4 text-orange-500 dark:text-orange-400' />
              <AlertTitle className='text-orange-500'>
                Tiempo restante para completar el pago
              </AlertTitle>
              <AlertDescription className='text-orange-500/80'>
                {countdown.formatted}
              </AlertDescription>
            </Alert>
          )}

          {countdown.isExpired && (
            <Alert variant='destructive'>
              <AlertTitle>Reserva expirada</AlertTitle>
              <AlertDescription>
                El tiempo para completar el pago ha expirado. Por favor, crea
                una nueva orden.
              </AlertDescription>
            </Alert>
          )}

          {/* Order Details */}
          <div className='rounded-lg border bg-card p-4 sm:p-6 space-y-4 sm:space-y-6'>
            {/* Event Info */}
            <div className='flex gap-3 sm:gap-4'>
              {displayImage && (
                <div className='shrink-0'>
                  <img
                    src={displayImage.url}
                    alt={`Imagen de ${order.event?.name || 'evento'}`}
                    className='w-16 h-16 sm:w-24 sm:h-24 rounded-lg object-cover object-center'
                  />
                </div>
              )}
              <div className='flex-1 min-w-0'>
                <TextEllipsis
                  as='h3'
                  className='font-semibold text-base sm:text-lg leading-tight'
                  maxLines={1}
                >
                  {order.event?.name}
                </TextEllipsis>
                <div className='mt-1 sm:mt-2 space-y-0.5 sm:space-y-1 text-sm text-muted-foreground'>
                  {order.event?.eventStartDate && (
                    <div className='flex items-center gap-1.5'>
                      <Calendar className='h-3.5 w-3.5 shrink-0' />
                      <span>
                        {formatEventDate(new Date(order.event.eventStartDate))}
                      </span>
                    </div>
                  )}
                  {order.event?.venueName && (
                    <div className='flex items-center gap-1.5'>
                      <MapPin className='h-3.5 w-3.5 shrink-0' />
                      <span className='truncate'>{order.event.venueName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className='border-t pt-4 sm:pt-6'>
              <h2 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4'>
                Detalles de la orden
              </h2>
              <div className='space-y-2 sm:space-y-3'>
                <div className='flex justify-between items-center text-sm gap-2'>
                  <span className='text-muted-foreground shrink-0'>
                    Orden ID:
                  </span>
                  <CopyableText
                    text={order.id}
                    truncateOnMobile
                    successMessage='ID de orden copiado'
                  />
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Estado:</span>
                  <span>{getOrderStatusLabel(order.status)}</span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className='border-t pt-4 sm:pt-6'>
              <div className='flex items-center gap-2 mb-3 sm:mb-4'>
                <Ticket className='w-4 h-4 sm:w-5 sm:h-5 text-primary' />
                <h2 className='text-base sm:text-lg font-semibold'>Entradas</h2>
              </div>
              <div className='space-y-3'>
                {/* Group items by ticket wave name */}
                {Object.entries(
                  (order.items || []).reduce(
                    (acc: Record<string, typeof order.items>, item: any) => {
                      const waveName = item.ticketWaveName;
                      if (!acc[waveName]) {
                        acc[waveName] = [];
                      }
                      acc[waveName].push(item);
                      return acc;
                    },
                    {},
                  ),
                ).map(([ticketWaveName, items]: [string, any[]]) => (
                  <TicketWaveCard
                    key={ticketWaveName}
                    mode='readonly'
                    ticketWaveName={ticketWaveName}
                    currency={currency}
                    items={items.map((item: any) => ({
                      id: item.id,
                      quantity: item.quantity,
                      pricePerTicket: item.pricePerTicket,
                      subtotal: item.subtotal,
                    }))}
                  />
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className='border-t pt-4 sm:pt-6 space-y-2 sm:space-y-3'>
              <div className='flex justify-between text-sm'>
                <span>Subtotal:</span>
                <span>
                  {formatPrice(Number(order.subtotalAmount), currency)}
                </span>
              </div>
              <div className='flex justify-between text-xs sm:text-sm text-muted-foreground'>
                <span>Comisión (6%):</span>
                <span>
                  {formatPrice(Number(order.platformCommission), currency)}
                </span>
              </div>
              <div className='flex justify-between text-xs sm:text-sm text-muted-foreground'>
                <span>IVA (22%):</span>
                <span>
                  {formatPrice(Number(order.vatOnCommission), currency)}
                </span>
              </div>
              <div className='flex justify-between font-bold text-base sm:text-lg border-t pt-2 sm:pt-3'>
                <span>Total a pagar:</span>
                <span>{formatPrice(Number(order.totalAmount), currency)}</span>
              </div>
            </div>
          </div>

          {/* Payer country: locks dLocal checkout to this country to avoid 5000 on retry. Searchable. */}
          <div className='space-y-2'>
            <Label htmlFor='payer-country'>País desde el que pagas</Label>
            <Popover
              open={countryPopoverOpen}
              onOpenChange={setCountryPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  id='payer-country'
                  variant='outline'
                  role='combobox'
                  aria-expanded={countryPopoverOpen}
                  disabled={countdown.isExpired}
                  className='w-full justify-between font-normal'
                >
                  {CHECKOUT_COUNTRIES.find(c => c.value === payerCountry)
                    ?.label ?? 'Elige tu país'}
                  <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className='w-[var(--radix-popover-trigger-width)] p-0'
                align='start'
              >
                <Command>
                  <CommandInput placeholder='Buscar país...' />
                  <CommandList>
                    <CommandEmpty>No hay resultados.</CommandEmpty>
                    <CommandGroup>
                      {CHECKOUT_COUNTRIES.map(c => (
                        <CommandItem
                          key={c.value}
                          value={c.label}
                          onSelect={() => {
                            setPayerCountry(c.value);
                            setCountryPopoverOpen(false);
                          }}
                        >
                          {c.label}
                          {payerCountry === c.value ? (
                            <Check className='ml-auto h-4 w-4' />
                          ) : null}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Payment Disclaimer */}
          <Alert>
            <InfoIcon className='h-4 w-4' />
            <AlertTitle>Información de pago</AlertTitle>
            <AlertDescription className='space-y-2'>
              <p>
                Serás redirigido a nuestro procesador de pagos para completar la
                transacción de forma segura. No necesitas proporcionar
                información adicional aquí.
              </p>
              <p className='text-xs text-muted-foreground'>
                El pago será procesado en tu moneda local. El tipo de cambio
                será determinado al momento del pago.
              </p>
            </AlertDescription>
          </Alert>

          {/* Desktop Action Buttons */}
          <div className='hidden md:flex justify-between items-center'>
            <Button
              variant='ghost'
              className='text-muted-foreground hover:text-destructive'
              onClick={() => setShowCancelDialog(true)}
              disabled={countdown.isExpired || isRedirecting}
            >
              <X className='mr-2 h-4 w-4' />
              Cancelar orden
            </Button>
            <Button
              size='lg'
              className='bg-primary-gradient h-12 px-8'
              disabled={isButtonDisabled}
              onClick={() => createPaymentLink.mutate({country: payerCountry})}
            >
              {getButtonText()}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <StickyBottomBar>
        <div className='flex flex-col gap-2'>
          {/* Countdown Timer Row */}
          {!countdown.isExpired && (
            <div className='flex items-center justify-center gap-2 text-orange-500'>
              <ClockIcon className='h-3.5 w-3.5' />
              <span className='text-xs font-medium'>
                Expira en {countdown.formatted}
              </span>
            </div>
          )}
          {countdown.isExpired && (
            <div className='flex items-center justify-center gap-2 text-destructive'>
              <ClockIcon className='h-3.5 w-3.5' />
              <span className='text-xs font-medium'>Reserva expirada</span>
            </div>
          )}
          {/* Price and Button Row */}
          <div className='flex items-center justify-between gap-4'>
            <div className='flex flex-col min-w-0'>
              <div className='flex items-center gap-2'>
                <span className='text-xs text-muted-foreground'>
                  Total a pagar
                </span>
                {!countdown.isExpired && (
                  <button
                    type='button'
                    onClick={() => setShowCancelDialog(true)}
                    className='text-xs text-muted-foreground hover:text-destructive underline'
                  >
                    Cancelar
                  </button>
                )}
              </div>
              <span className='font-bold text-lg text-primary'>
                {formatPrice(Number(order.totalAmount), currency)}
              </span>
            </div>
            <Button
              size='lg'
              className='bg-primary-gradient h-12 px-6 text-base font-semibold'
              disabled={isButtonDisabled}
              onClick={() => createPaymentLink.mutate({country: payerCountry})}
            >
              {createPaymentLink.isPending ? 'Procesando...' : 'Pagar'}
            </Button>
          </div>
        </div>
      </StickyBottomBar>

      {/* Cancel Order Dialog */}
      <CancelOrderDialog
        orderId={orderId}
        eventId={order.eventId}
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
      />
    </Suspense>
  );
};
