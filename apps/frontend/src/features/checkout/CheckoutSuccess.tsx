import {Suspense} from 'react';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Link} from '@tanstack/react-router';
import {getOrderByIdQuery} from '~/lib';
import {formatPrice, formatEventDate} from '~/utils';
import {Button} from '~/components/ui/button';
import {Alert, AlertDescription, AlertTitle} from '~/components/ui/alert';
import {CheckCircle2, CalendarIcon, MapPinIcon, TicketIcon} from 'lucide-react';
import {FullScreenLoading} from '~/components';

interface CheckoutSuccessPageProps {
  orderId: string;
}

export const CheckoutSuccessPage = ({orderId}: CheckoutSuccessPageProps) => {
  const order = useSuspenseQuery(getOrderByIdQuery(orderId)).data;

  const currency = order.items[0]!.currency!;

  // Find flyer image from event images
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
          {/* Success Header */}
          <div className='text-center space-y-4'>
            <div className='flex justify-center'>
              <div className='rounded-full bg-green-100 dark:bg-green-900 p-4'>
                <CheckCircle2 className='h-12 w-12 text-green-600 dark:text-green-400' />
              </div>
            </div>
            <div>
              <h1 className='text-3xl font-bold mb-2'>¡Pago confirmado!</h1>
              <p className='text-muted-foreground'>
                Tu compra ha sido procesada exitosamente
              </p>
            </div>
          </div>

          {/* Success Alert */}
          <Alert className='border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800'>
            <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400' />
            <AlertTitle className='text-green-900 dark:text-green-100'>
              Orden confirmada
            </AlertTitle>
            <AlertDescription className='text-green-800 dark:text-green-200'>
              Hemos enviado un correo electrónico con los detalles de tu compra
              y tus entradas. También puedes acceder a ellas en tu perfil en
              cualquier momento.
            </AlertDescription>
          </Alert>

          {/* Event Details */}
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
                <div className='flex-1 space-y-3'>
                  <div>
                    <p className='font-medium text-lg'>{order.event?.name}</p>
                  </div>
                  {order.event?.eventStartDate && (
                    <div className='flex items-start gap-2 text-sm'>
                      <CalendarIcon className='h-4 w-4 text-muted-foreground mt-0.5' />
                      <span className='text-muted-foreground'>
                        {formatEventDate(new Date(order.event.eventStartDate))}
                      </span>
                    </div>
                  )}
                  {order.event?.venueName && (
                    <div className='flex items-start gap-2 text-sm'>
                      <MapPinIcon className='h-4 w-4 text-muted-foreground mt-0.5' />
                      <div className='text-muted-foreground'>
                        <p className='font-medium'>{order.event.venueName}</p>
                        {order.event.venueAddress && (
                          <p>{order.event.venueAddress}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Details */}
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
                  <span className='inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium'>
                    <CheckCircle2 className='h-3 w-3' />
                    Confirmada
                  </span>
                </div>
                {order.confirmedAt && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>
                      Confirmada el:
                    </span>
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
            <div className='border-t pt-6'>
              <h2 className='text-xl font-semibold mb-4'>Tus entradas</h2>
              <div className='space-y-4'>
                {order.items?.map((item: any) => (
                  <div
                    key={item.id}
                    className='flex justify-between items-start p-4 border rounded-lg bg-muted/30'
                  >
                    <div className='flex-1 flex items-start gap-3'>
                      <TicketIcon className='h-5 w-5 text-muted-foreground mt-0.5' />
                      <div>
                        <p className='font-medium'>{item.ticketWaveName}</p>
                        <p className='text-sm text-muted-foreground'>
                          Cantidad: {item.quantity}
                        </p>
                        <p className='text-xs text-muted-foreground mt-1'>
                          {formatPrice(item.pricePerTicket, currency)} por
                          entrada
                        </p>
                      </div>
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

            {/* Payment Summary */}
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
                <span>Total pagado:</span>
                <span>{formatPrice(Number(order.totalAmount), currency)}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className='rounded-lg border bg-muted/30 p-6'>
            <h3 className='font-semibold mb-3'>¿Qué sigue?</h3>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li className='flex items-start gap-2'>
                <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0' />
                <span>
                  Revisa tu correo electrónico para encontrar los detalles de tu
                  compra
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0' />
                <span>
                  Accede a tus entradas en cualquier momento desde tu perfil
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0' />
                <span>
                  Presenta tu entrada digital en la entrada del evento
                </span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            <Button asChild variant='outline' size='lg'>
              <Link to='/cuenta/compras'>Ver mis compras</Link>
            </Button>
            {order.eventId && (
              <Button asChild size='lg' className='bg-primary-gradient'>
                <Link to='/eventos/$eventId' params={{eventId: order.eventId}}>
                  Volver al evento
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Suspense>
  );
};
