import {Suspense, useEffect} from 'react';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Link} from '@tanstack/react-router';
import {getOrderByIdQuery} from '~/lib';
import {formatPrice, formatEventDate, getEventDisplayImage} from '~/utils';
import {Button} from '~/components/ui/button';
import {CheckCircle2, Calendar, MapPin, Ticket} from 'lucide-react';
import {FullScreenLoading, CopyableText, TextEllipsis} from '~/components';
import {TicketWaveCard} from '~/features/event/tickets';
import {usePostHog} from 'posthog-js/react';

interface CheckoutSuccessPageProps {
  orderId: string;
}

export const CheckoutSuccessPage = ({orderId}: CheckoutSuccessPageProps) => {
  const order = useSuspenseQuery(getOrderByIdQuery(orderId)).data;
  const posthog = usePostHog();

  useEffect(() => {
    posthog.capture('checkout_completed', {
      order_id: order.id,
      event_id: order.eventId,
      event_name: order.event?.name,
      total_amount: Number(order.totalAmount),
      subtotal_amount: Number(order.subtotalAmount),
      platform_commission: Number(order.platformCommission),
      currency: order.items[0]?.currency,
      ticket_count: order.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const currency = order.items[0]!.currency!;

  const eventWithImages = order.event as typeof order.event & {
    images?: Array<{imageType: string; url: string}>;
  };
  const displayImage = getEventDisplayImage(eventWithImages?.images);

  return (
    <Suspense fallback={<FullScreenLoading />}>
      <div className='container mx-auto px-2 py-4 sm:py-6'>
        <div className='max-w-3xl mx-auto space-y-4 sm:space-y-6'>
          {/* Success Header */}
          <div className='text-center space-y-3'>
            <div className='flex justify-center'>
              <div className='rounded-full bg-green-100 dark:bg-green-900 p-3'>
                <CheckCircle2 className='h-10 w-10 text-green-600 dark:text-green-400' />
              </div>
            </div>
            <div>
              <h1 className='text-2xl sm:text-3xl font-bold mb-1'>
                Listo, ya tenés tus entradas
              </h1>
              <p className='text-sm sm:text-base text-muted-foreground'>
                Te mandamos un mail con los detalles de tu compra.
              </p>
            </div>
          </div>

          {/* Event + Order Details Card */}
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
                {order.event?.name && (
                  <Link
                    to='/eventos/$slug'
                    params={{slug: order.event?.slug!}}
                    className='hover:underline'
                  >
                    <TextEllipsis
                      as='h3'
                      className='font-semibold text-base sm:text-lg leading-tight'
                      maxLines={2}
                    >
                      {order.event.name}
                    </TextEllipsis>
                  </Link>
                )}
                <div className='mt-1 sm:mt-2 space-y-0.5 sm:space-y-1 text-sm text-muted-foreground'>
                  {order.event?.eventStartDate && (
                    <div className='flex items-center gap-1.5'>
                      <Calendar className='h-3.5 w-3.5 shrink-0' />
                      <span className='truncate'>
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

            {/* Order Details */}
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
                  <span className='inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium text-xs'>
                    <CheckCircle2 className='h-3 w-3' />
                    Confirmada
                  </span>
                </div>
                {order.confirmedAt && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Confirmada el:</span>
                    <span>
                      {new Date(order.confirmedAt).toLocaleString('es-UY', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tickets */}
            <div className='border-t pt-4 sm:pt-6'>
              <div className='flex items-center gap-2 mb-3 sm:mb-4'>
                <Ticket className='w-4 h-4 sm:w-5 sm:h-5 text-primary' />
                <h2 className='text-base sm:text-lg font-semibold'>
                  Tus entradas
                </h2>
              </div>
              <div className='space-y-3'>
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

            {/* Payment Summary */}
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
                <span>Total pagado:</span>
                <span>{formatPrice(Number(order.totalAmount), currency)}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className='rounded-lg border bg-muted/30 p-4 sm:p-6'>
            <h3 className='font-semibold mb-3'>¿Qué sigue?</h3>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li className='flex items-start gap-2'>
                <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0' />
                <span>
                  Revisá tu correo para ver los detalles de tu compra
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0' />
                <span>
                  Accedé a tus entradas en cualquier momento desde tu perfil
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0' />
                <span>
                  Mostrá tu entrada digital en la puerta del evento
                </span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            {order.eventId && (
              <Button asChild size='lg' className='bg-primary-gradient'>
                <Link to='/cuenta/entradas'>Ver mis entradas</Link>
              </Button>
            )}
            <Button asChild variant='ghost' size='lg'>
              <Link to='/eventos/$slug' params={{slug: order.event?.slug!}}>
                Volver al evento
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Suspense>
  );
};
