import {Suspense, useEffect, useRef, useState} from 'react';
import {useSuspenseQuery, useMutation} from '@tanstack/react-query';
import {useNavigate} from '@tanstack/react-router';
import {toast} from 'sonner';
import {
  getOrderByIdQuery,
  EventTicketCurrency,
  createPaymentLinkMutation,
} from '~/lib';
import {formatPrice, formatEventDate} from '~/utils';
import {useCountdown} from '~/hooks';
import {Button} from '~/components/ui/button';
import {Alert, AlertDescription, AlertTitle} from '~/components/ui/alert';
import {InfoIcon, ClockIcon} from 'lucide-react';
import {FullScreenLoading} from '~/components';

interface CheckoutPageProps {
  orderId: string;
}

export const CheckoutPage = ({orderId}: CheckoutPageProps) => {
  const order = useSuspenseQuery(getOrderByIdQuery(orderId)).data;
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const countdown = useCountdown(
    order.reservationExpiresAt ? new Date(order.reservationExpiresAt) : null,
  );

  const createPaymentLink = useMutation({
    ...createPaymentLinkMutation(orderId),
    onSuccess: data => {
      // Set redirecting state before navigation
      setIsRedirecting(true);
      // Redirect to dLocal payment page
      navigate({href: data.redirectUrl});
    },
    onError: err => {
      console.log('ERROR', err);
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

  // Find flyer image from event images
  // Type assertion needed since generated types don't include images yet
  const eventWithImages = order.event as typeof order.event & {
    images?: Array<{imageType: string; url: string}>;
  };
  const flyerImage = eventWithImages?.images?.find(
    (img: {imageType: string; url: string}) => img.imageType === 'flyer',
  );

  return (
    <Suspense fallback={<FullScreenLoading />}>
      <div className='container mx-auto py-6'>
        <div className='max-w-3xl mx-auto space-y-6'>
          {/* Header */}
          <div>
            <h1 className='text-3xl font-bold mb-2'>Checkout</h1>
            <p className='text-muted-foreground'>
              Completa el pago para confirmar tu reserva
            </p>
          </div>

          {/* Reservation Timer Alert */}
          {!countdown.isExpired && (
            <Alert className='border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800'>
              <ClockIcon className='h-4 w-4 text-orange-600 dark:text-orange-400' />
              <AlertTitle className='text-orange-900 dark:text-orange-100'>
                Tiempo restante para completar el pago
              </AlertTitle>
              <AlertDescription className='text-orange-800 dark:text-orange-200'>
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
          <div className='rounded-lg border bg-card p-6 space-y-6'>
            <div>
              <h2 className='text-xl font-semibold mb-4'>
                Detalles del evento
              </h2>
              <div className='flex gap-4'>
                {flyerImage && (
                  <div className='shrink-0'>
                    <img
                      src={flyerImage.url}
                      alt={`Flyer de ${order.event?.name || 'evento'}`}
                      className='w-32 h-32 object-cover rounded-lg'
                    />
                  </div>
                )}
                <div className='flex-1 space-y-2'>
                  <div>
                    <p className='font-medium text-lg'>{order.event?.name}</p>
                    <p className='text-sm text-muted-foreground'>
                      {order.event?.eventStartDate &&
                        formatEventDate(new Date(order.event.eventStartDate))}
                    </p>
                  </div>
                  {order.event?.venueName && (
                    <div className='text-sm text-muted-foreground'>
                      <p className='font-medium'>{order.event.venueName}</p>
                      {order.event.venueAddress && (
                        <p>{order.event.venueAddress}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className='border-t pt-6'>
              <h2 className='text-xl font-semibold mb-4'>
                Detalles de la orden
              </h2>
              <div className='space-y-3'>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Orden ID:</span>
                  <span className='font-mono'>{order.id}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Estado:</span>
                  <span className='capitalize'>{order.status}</span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className='border-t pt-6'>
              <h2 className='text-xl font-semibold mb-4'>Entradas</h2>
              <div className='space-y-4'>
                {order.items?.map((item: any) => (
                  <div
                    key={item.id}
                    className='flex justify-between items-start p-4 border rounded-lg'
                  >
                    <div className='flex-1'>
                      <p className='font-medium'>{item.ticketWaveName}</p>
                      <p className='text-sm text-muted-foreground'>
                        {item.quantity} ×{' '}
                        {formatPrice(item.pricePerTicket, currency)}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='font-semibold'>
                        {formatPrice(item.subtotal, currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className='border-t pt-6 space-y-3'>
              <div className='flex justify-between text-sm'>
                <span>Subtotal:</span>
                <span>
                  {formatPrice(Number(order.subtotalAmount), currency)}
                </span>
              </div>
              <div className='flex justify-between text-sm text-muted-foreground'>
                <span>Comisión de plataforma (6%):</span>
                <span>
                  {formatPrice(Number(order.platformCommission), currency)}
                </span>
              </div>
              <div className='flex justify-between text-sm text-muted-foreground'>
                <span>IVA sobre comisión (22%):</span>
                <span>
                  {formatPrice(Number(order.vatOnCommission), currency)}
                </span>
              </div>
              <div className='flex justify-between font-bold text-lg border-t pt-3'>
                <span>Total a pagar:</span>
                <span>{formatPrice(Number(order.totalAmount), currency)}</span>
              </div>
            </div>
          </div>

          {/* Payment Disclaimer */}
          <Alert>
            <InfoIcon className='h-4 w-4' />
            <AlertTitle>Información de pago</AlertTitle>
            <AlertDescription>
              Serás redirigido a dLocal Go para completar el pago de forma
              segura. No necesitas proporcionar información adicional aquí.
            </AlertDescription>
          </Alert>

          {/* Confirm Button */}
          <div className='flex justify-end'>
            <Button
              size='lg'
              className='bg-primary-gradient h-12 px-8'
              disabled={
                countdown.isExpired ||
                createPaymentLink.isPending ||
                isRedirecting
              }
              onClick={() => createPaymentLink.mutate()}
            >
              {countdown.isExpired
                ? 'Reserva expirada'
                : isRedirecting
                  ? 'Redirigiendo...'
                  : createPaymentLink.isPending
                    ? 'Creando link de pago...'
                    : 'Continuar con el pago'}
            </Button>
          </div>
        </div>
      </div>
    </Suspense>
  );
};
