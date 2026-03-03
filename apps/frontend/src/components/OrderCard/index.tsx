import {Link} from '@tanstack/react-router';
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Ticket,
  FileCheck,
  X,
  CreditCard,
  MapPin,
} from 'lucide-react';
import {Card, CardContent} from '~/components/ui/card';
import {EventTicketCurrency} from '~/lib';
import {formatPrice, formatEventDate, getEventDisplayImage} from '~/utils';
import {TicketViewModal, CancelOrderDialog} from '~/components';
import {useState} from 'react';
import {Button} from '~/components/ui/button';
import {useQuery} from '@tanstack/react-query';
import {getOrderTicketsQuery} from '~/lib/api/order';
import {CDN_ASSETS} from '~/assets';

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
      venueName?: string | null;
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
    accentColor: 'from-yellow-400 to-yellow-500',
    bgColor: 'border-yellow-500/30 bg-yellow-500/5',
    badgeBg: 'bg-yellow-500/10',
    badgeText: 'text-yellow-600 dark:text-yellow-400',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmada',
    accentColor: 'from-green-400 to-green-500',
    bgColor: 'border-green-500/30 bg-green-500/5',
    badgeBg: 'bg-green-500/10',
    badgeText: 'text-green-600 dark:text-green-400',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelada',
    accentColor: 'from-red-400 to-red-500',
    bgColor: 'border-red-500/30 bg-red-500/5',
    badgeBg: 'bg-red-500/10',
    badgeText: 'text-red-600 dark:text-red-400',
    icon: XCircle,
  },
  expired: {
    label: 'Expirada',
    accentColor: 'from-gray-400 to-gray-500',
    bgColor: 'border-gray-500/30 bg-gray-500/5',
    badgeBg: 'bg-gray-500/10',
    badgeText: 'text-gray-600 dark:text-gray-400',
    icon: XCircle,
  },
} as const;

function ViewTicketsButton({orderId}: {orderId: string}) {
  const [open, setOpen] = useState(false);
  const {data: orderTicketsData} = useQuery(getOrderTicketsQuery(orderId));

  const hasDocuments = orderTicketsData?.tickets.some(
    ticket => ticket.hasDocument,
  );

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant={hasDocuments ? 'default' : 'outline'}
        className='flex-1 sm:flex-none'
      >
        {hasDocuments ? (
          <FileCheck className='mr-2 h-4 w-4' />
        ) : (
          <Ticket className='mr-2 h-4 w-4' />
        )}
        Ver tickets
      </Button>
      <TicketViewModal orderId={orderId} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function OrderCard({order}: OrderCardProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showOrderDetailsDialog, setShowOrderDetailsDialog] = useState(false);
  const status = STATUS_CONFIG[order.status];
  const StatusIcon = status.icon;

  const displayImage = getEventDisplayImage(order.event?.images);
  const imageSrc = displayImage?.url ?? CDN_ASSETS.DEFAULT_OG_IMAGE;

  const totalTickets =
    order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <Card className={`overflow-hidden ${status.bgColor}`}>
      <CardContent className='p-0'>
        <div className='flex'>
          {/* Left accent bar */}
          <div className={`w-1.5 bg-gradient-to-b ${status.accentColor}`} />

          <div className='flex-1 p-4'>
            {/* Header with event image and info */}
            <div className='flex gap-3'>
              {/* Event Flyer */}
              <Link
                to='/eventos/$eventId'
                params={{eventId: order.eventId}}
                className='shrink-0'
              >
                <img
                  src={imageSrc}
                  alt={order.event?.name || 'Event'}
                  className='h-16 w-16 rounded-lg object-cover object-center sm:h-20 sm:w-20'
                />
              </Link>

              {/* Event Info */}
              <div className='min-w-0 flex-1'>
                <div className='flex items-start justify-between gap-2'>
                  <Link
                    to='/eventos/$eventId'
                    params={{eventId: order.eventId}}
                    className='hover:text-primary transition-colors'
                  >
                    <h3 className='font-semibold text-base leading-tight line-clamp-2'>
                      {order.event?.name}
                    </h3>
                  </Link>

                  {/* Status badge */}
                  <div
                    className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${status.badgeBg} ${status.badgeText}`}
                  >
                    <StatusIcon className='h-3 w-3' />
                    <span className='hidden sm:inline'>{status.label}</span>
                  </div>
                </div>

                {/* Event details */}
                <div className='mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground'>
                  {order.event?.eventStartDate && (
                    <div className='flex items-center gap-1'>
                      <Calendar className='h-3.5 w-3.5' />
                      <span>
                        {formatEventDate(new Date(order.event.eventStartDate))}
                      </span>
                    </div>
                  )}
                  {order.event?.venueName && (
                    <div className='hidden sm:flex items-center gap-1'>
                      <MapPin className='h-3.5 w-3.5' />
                      <span className='truncate max-w-[150px]'>
                        {order.event.venueName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Ticket summary - desktop */}
                <div className='hidden sm:flex items-center gap-1.5 mt-2 text-sm'>
                  <Ticket className='h-3.5 w-3.5 text-muted-foreground' />
                  <span className='text-muted-foreground'>
                    {totalTickets} {totalTickets === 1 ? 'entrada' : 'entradas'}
                  </span>
                  <span className='text-muted-foreground'>·</span>
                  <span className='font-medium'>
                    {formatPrice(Number(order.totalAmount), order.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Ticket items - mobile */}
            <div className='sm:hidden mt-3 space-y-1'>
              {order.items?.map(item => (
                <div
                  key={item.id}
                  className='flex items-center justify-between text-sm'
                >
                  <span className='text-muted-foreground truncate'>
                    {item.quantity}x {item.ticketWaveName}
                  </span>
                  <span className='shrink-0 font-medium'>
                    {formatPrice(Number(item.subtotal), order.currency)}
                  </span>
                </div>
              ))}
              <div className='flex items-center justify-between pt-1 border-t'>
                <span className='text-sm font-medium'>Total</span>
                <span className='font-semibold'>
                  {formatPrice(Number(order.totalAmount), order.currency)}
                </span>
              </div>
            </div>

            {/* Action section */}
            {(order.status === 'pending' || order.status === 'confirmed') && (
              <div className='mt-3 flex items-center gap-2'>
                {order.status === 'pending' && (
                  <>
                    <Link
                      to='/checkout/$orderId'
                      params={{orderId: order.id}}
                      className='flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors'
                    >
                      <CreditCard className='h-4 w-4' />
                      Completar pago
                    </Link>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-muted-foreground hover:text-destructive'
                      onClick={() => setShowCancelDialog(true)}
                    >
                      <X className='h-4 w-4' />
                      <span className='hidden sm:inline ml-1'>Cancelar</span>
                    </Button>
                  </>
                )}
                {order.status === 'confirmed' && (
                  <ViewTicketsButton orderId={order.id} />
                )}
              </div>
            )}

            {/* Order metadata */}
            <div className='mt-3 pt-3 border-t border-dashed flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground'>
              <span className='truncate'>
                <span className='font-medium'>Orden:</span>{' '}
                {order.id.slice(0, 8)}...
              </span>
              <span className='hidden sm:inline'>·</span>
              <span>
                <span className='font-medium'>Creada:</span>{' '}
                {new Date(order.createdAt).toLocaleDateString('es-UY', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <CancelOrderDialog
        orderId={order.id}
        eventId={order.eventId}
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
      />
    </Card>
  );
}
