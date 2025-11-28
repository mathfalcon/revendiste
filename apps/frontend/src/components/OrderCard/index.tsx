import {Link} from '@tanstack/react-router';
import {CheckCircle, XCircle, Clock, Calendar, Ticket} from 'lucide-react';
import {Card, CardContent} from '~/components/ui/card';
import {EventTicketCurrency} from '~/lib';
import {formatPrice, formatEventDate} from '~/utils';
import {TicketViewModal} from '~/components';
import {useState} from 'react';
import {Button} from '~/components/ui/button';

interface OrderCardProps {
  order: {
    id: string;
    eventId: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
    totalAmount: string;
    subtotalAmount: string;
    platformCommission: string;
    vatOnCommission: string;
    currency: EventTicketCurrency;
    createdAt: string;
    event?: {
      name?: string | null;
      eventStartDate?: string | null;
      images?: Array<{
        imageType: string;
        url: string;
      }>;
    };
    items?: Array<{
      id: string;
      quantity: number;
      ticketWaveName: string | null;
      subtotal: string;
    }>;
  };
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    className: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmada',
    className: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelada',
    className: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
  expired: {
    label: 'Expirada',
    className: 'bg-gray-100 text-gray-800',
    icon: XCircle,
  },
} as const;

function ViewTicketsButton({orderId}: {orderId: string}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant='outline'
        className='flex items-center gap-2'
      >
        <Ticket className='h-4 w-4' />
        Ver tickets
      </Button>
      <TicketViewModal orderId={orderId} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function OrderCard({order}: OrderCardProps) {
  const status = STATUS_CONFIG[order.status];
  const StatusIcon = status.icon;

  // Find flyer image
  const flyerImage = order.event?.images?.find(
    img => img.imageType === 'flyer',
  );

  return (
    <Card className='overflow-hidden'>
      <CardContent className='p-4'>
        <div className='flex gap-4'>
          {/* Event image */}
          {flyerImage && (
            <Link
              to='/eventos/$eventId'
              params={{eventId: order.eventId}}
              className='shrink-0'
            >
              <img
                src={flyerImage.url}
                alt={order.event?.name || 'Event'}
                className='h-24 w-24 rounded-lg object-cover'
              />
            </Link>
          )}

          {/* Order details */}
          <div className='flex-1 space-y-2'>
            <div className='flex items-start justify-between'>
              <div>
                <Link
                  to='/eventos/$eventId'
                  params={{eventId: order.eventId}}
                  className='font-semibold hover:underline'
                >
                  {order.event?.name}
                </Link>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Calendar className='h-3 w-3' />
                  <span>
                    {order.event?.eventStartDate &&
                      formatEventDate(new Date(order.event.eventStartDate))}
                  </span>
                </div>
              </div>
              <div
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
              >
                <StatusIcon className='h-3 w-3' />
                {status.label}
              </div>
            </div>

            {/* Order items */}
            <div className='space-y-1 text-sm'>
              {order.items?.map(item => (
                <div key={item.id} className='flex justify-between'>
                  <span className='text-muted-foreground'>
                    {item.quantity}x {item.ticketWaveName}
                  </span>
                  <span>
                    {formatPrice(Number(item.subtotal), order.currency)}
                  </span>
                </div>
              ))}
            </div>

            {/* Order totals */}
            <div className='border-t pt-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Subtotal:</span>
                <span>
                  {formatPrice(Number(order.subtotalAmount), order.currency)}
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Comisión + IVA:</span>
                <span>
                  {formatPrice(
                    Number(order.platformCommission) +
                      Number(order.vatOnCommission),
                    order.currency,
                  )}
                </span>
              </div>
              <div className='flex justify-between font-semibold'>
                <span>Total:</span>
                <span>
                  {formatPrice(Number(order.totalAmount), order.currency)}
                </span>
              </div>
            </div>

            {/* Order metadata */}
            <div className='flex gap-4 text-xs text-muted-foreground'>
              <span>ID: {order.id}</span>
              <span>
                Creada:{' '}
                {new Date(order.createdAt).toLocaleDateString('es-UY', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* Action buttons */}
            <div className='flex gap-2 pt-2'>
              {order.status === 'pending' && (
                <Link
                  to='/checkout/$orderId'
                  params={{orderId: order.id}}
                  className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
                >
                  Completar pago
                </Link>
              )}
              {order.status === 'confirmed' && (
                <ViewTicketsButton orderId={order.id} />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
