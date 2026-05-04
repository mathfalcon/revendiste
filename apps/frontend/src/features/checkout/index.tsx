import {Suspense, useEffect, useRef, useState} from 'react';
import {useSuspenseQuery, useMutation} from '@tanstack/react-query';
import {ANALYTICS_EVENTS, trackEvent} from '~/lib/analytics';
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
  Globe,
  AlertCircle,
} from 'lucide-react';
import {
  FullScreenLoading,
  CopyableText,
  StickyBottomBar,
  CancelOrderDialog,
  TextEllipsis,
} from '~/components';
import {TicketWaveCard} from '~/features/event/tickets';

/** Americas only (dLocal Go). ISO 3166-1 alpha-2 → label. Top 3 pinned, rest alphabetical. */
const CHECKOUT_COUNTRIES: Array<{value: string; label: string}> = [
  {value: 'UY', label: 'Uruguay'},
  {value: 'AR', label: 'Argentina'},
  {value: 'BR', label: 'Brasil'},
  {value: 'BO', label: 'Bolivia'},
  {value: 'CL', label: 'Chile'},
  {value: 'CO', label: 'Colombia'},
  {value: 'CR', label: 'Costa Rica'},
  {value: 'EC', label: 'Ecuador'},
  {value: 'GT', label: 'Guatemala'},
  {value: 'MX', label: 'México'},
  {value: 'PA', label: 'Panamá'},
  {value: 'PY', label: 'Paraguay'},
  {value: 'PE', label: 'Perú'},
];

interface CheckoutPageProps {
  orderId: string;
}

export const CheckoutPage = ({orderId}: CheckoutPageProps) => {
  const order = useSuspenseQuery(getOrderByIdQuery(orderId)).data;
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [payerCountry, setPayerCountry] = useState<string>('');
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);
  const [countryTouched, setCountryTouched] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);

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
    onError: () => {
      trackEvent(ANALYTICS_EVENTS.PAYMENT_LINK_ERROR, {
        order_id: orderId,
        country: payerCountry,
      });
      toast.error('No pudimos crear el link de pago. Intentá de nuevo.');
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
    if (order.event?.slug) {
      navigate({
        to: '/eventos/$slug',
        params: {slug: order.event.slug},
      });
    }
  };

  // Redirect to event page if booking is expired (with toast notification)
  useEffect(() => {
    if (countdown.isExpired && order.event?.slug && !hasShownToastRef.current) {
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
          to: '/eventos/$slug',
          params: {slug: order.event!.slug!},
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

  const isCountrySelected = payerCountry !== '';
  const showCountryError = countryTouched && !isCountrySelected;

  const isButtonDisabled =
    countdown.isExpired || createPaymentLink.isPending || isRedirecting;

  const getButtonText = () => {
    if (countdown.isExpired) return 'Reserva expirada';
    if (isRedirecting) return 'Redirigiendo...';
    if (createPaymentLink.isPending) return 'Creando link de pago...';
    return 'Continuar con el pago';
  };

  const handlePay = () => {
    if (!isCountrySelected) {
      setCountryTouched(true);
      countryRef.current?.scrollIntoView({behavior: 'smooth', block: 'center'});
      return;
    }
    trackEvent(ANALYTICS_EVENTS.CHECKOUT_PAYMENT_INITIATED, {
      order_id: orderId,
      country: payerCountry,
      total_amount: Number(order.totalAmount),
      value: Number(order.totalAmount),
      currency,
    });
    createPaymentLink.mutate({country: payerCountry});
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
              Completá el pago para confirmar tu reserva
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
                El tiempo para completar el pago expiró. Volvé al evento para
                crear una nueva orden.
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

          {/* Payer country — required step before payment */}
          <div
            ref={countryRef}
            className={`rounded-lg border bg-card p-4 sm:p-6 space-y-3 transition-colors ${
              showCountryError
                ? 'border-destructive ring-1 ring-destructive/30'
                : isCountrySelected
                  ? 'border-green-500/40'
                  : ''
            }`}
          >
            <div className='flex items-center gap-2'>
              <Globe className='h-4 w-4 sm:h-5 sm:w-5 text-primary' />
              <Label
                htmlFor='payer-country'
                className='text-base sm:text-lg font-semibold'
              >
                ¿Desde qué país pagás?
              </Label>
              <span className='text-xs text-destructive font-medium'>
                *Requerido
              </span>
            </div>
            <p className='text-sm text-muted-foreground'>
              Seleccioná tu país para que podamos mostrarte los medios de pago
              disponibles.
            </p>
            <Popover
              open={countryPopoverOpen}
              onOpenChange={open => {
                setCountryPopoverOpen(open);
                // Only mark as touched when closing without a selection
                if (!open && !isCountrySelected) setCountryTouched(true);
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  id='payer-country'
                  variant='outline'
                  role='combobox'
                  aria-expanded={countryPopoverOpen}
                  disabled={countdown.isExpired}
                  className={`w-full justify-between h-12 text-base ${
                    !isCountrySelected ? 'text-muted-foreground' : 'font-medium'
                  } ${showCountryError ? 'border-destructive' : ''}`}
                >
                  {isCountrySelected
                    ? CHECKOUT_COUNTRIES.find(c => c.value === payerCountry)
                        ?.label
                    : 'Elegí tu país...'}
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
                            trackEvent(
                              ANALYTICS_EVENTS.CHECKOUT_COUNTRY_SELECTED,
                              {
                                order_id: orderId,
                                country: c.value,
                              },
                            );
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
            {showCountryError && (
              <div className='flex items-center gap-1.5 text-sm text-destructive'>
                <AlertCircle className='h-3.5 w-3.5' />
                <span>Seleccioná un país para continuar</span>
              </div>
            )}
          </div>

          {/* Payment Disclaimer */}
          <Alert>
            <InfoIcon className='h-4 w-4' />
            <AlertTitle>Información de pago</AlertTitle>
            <AlertDescription className='space-y-2'>
              <p>
                Te vamos a redirigir a nuestro procesador de pagos para
                completar la transacción de forma segura.
              </p>
              <p className='text-xs text-muted-foreground'>
                El pago se procesa en tu moneda local. El tipo de cambio se
                determina al momento del pago.
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
              onClick={handlePay}
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
          {/* Country warning for mobile */}
          {!isCountrySelected && !countdown.isExpired && (
            <button
              type='button'
              onClick={() =>
                countryRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                })
              }
              className='flex items-center justify-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium'
            >
              <AlertCircle className='h-3 w-3' />
              <span>Seleccioná tu país antes de pagar</span>
            </button>
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
              onClick={handlePay}
            >
              {createPaymentLink.isPending ? 'Procesando...' : 'Pagar'}
            </Button>
          </div>
        </div>
      </StickyBottomBar>

      {/* Cancel Order Dialog */}
      <CancelOrderDialog
        orderId={orderId}
        eventSlug={order.event?.slug ?? undefined}
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
      />
    </Suspense>
  );
};
