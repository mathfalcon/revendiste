import {useState, useEffect} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useSearch, useNavigate} from '@tanstack/react-router';
import {getMyOrdersQuery} from '~/lib';
import {OrderCard, TicketViewModal} from '~/components';
import {CheckCircle, XCircle, Clock, QrCode} from 'lucide-react';
import {LoadingSpinner} from '~/components/LoadingScreen';
import {Card, CardContent} from '~/components/ui/card';
import {Link} from '@tanstack/react-router';

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  count: number;
  variant: 'pending' | 'confirmed' | 'cancelled';
}

function SectionHeader({
  icon: Icon,
  title,
  count,
  variant,
}: SectionHeaderProps) {
  const variantStyles = {
    pending: {
      iconColor: 'text-yellow-500',
      countBg: 'bg-yellow-500/10',
      countColor: 'text-yellow-600 dark:text-yellow-400',
    },
    confirmed: {
      iconColor: 'text-green-500',
      countBg: 'bg-green-500/10',
      countColor: 'text-green-600 dark:text-green-400',
    },
    cancelled: {
      iconColor: 'text-muted-foreground',
      countBg: 'bg-muted',
      countColor: 'text-muted-foreground',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className='flex items-center gap-2'>
      <Icon className={`h-5 w-5 ${styles.iconColor}`} />
      <h3 className='text-lg font-semibold'>{title}</h3>
      <span
        className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${styles.countBg} ${styles.countColor}`}
      >
        {count}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className='w-full'>
      <CardContent className='flex flex-col items-center justify-center py-16 px-6 text-center'>
        <div className='flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4'>
          <QrCode className='h-8 w-8 text-muted-foreground' />
        </div>
        <h3 className='text-lg font-semibold mb-2'>No tienes órdenes</h3>
        <p className='text-muted-foreground mb-6 max-w-sm'>
          Cuando compres entradas, aparecerán aquí para que puedas acceder a tus
          tickets.
        </p>
        <Link
          to='/'
          className='inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors'
        >
          Explorar eventos
        </Link>
      </CardContent>
    </Card>
  );
}

export function MyTicketsView() {
  const {data: orders, isPending} = useQuery(getMyOrdersQuery());
  const search = useSearch({from: '/cuenta/tickets'});
  const navigate = useNavigate({from: '/cuenta/tickets'});
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (search.orden) {
      setModalOpen(true);
    }
  }, [search.orden]);

  const handleCloseModal = () => {
    setModalOpen(false);
    navigate({
      search: prev => ({
        ...prev,
        orden: undefined,
      }),
    });
  };

  if (isPending) {
    return (
      <Card className='w-full'>
        <CardContent className='flex h-96 items-center justify-center'>
          <LoadingSpinner size={96} />
        </CardContent>
      </Card>
    );
  }

  // Separate orders by status
  const pendingOrders =
    orders?.filter(order => order.status === 'pending') || [];
  const confirmedOrders =
    orders?.filter(order => order.status === 'confirmed') || [];
  const cancelledOrders =
    orders?.filter(
      order => order.status === 'cancelled' || order.status === 'expired',
    ) || [];

  const hasNoOrders =
    pendingOrders.length === 0 &&
    confirmedOrders.length === 0 &&
    cancelledOrders.length === 0;

  return (
    <>
      <div className='space-y-6'>
        <div>
          <h2 className='text-2xl font-semibold'>Mis tickets</h2>
          <p className='text-muted-foreground'>
            Accede a tus órdenes en cualquier momento
          </p>
        </div>

        {/* Pending Orders */}
        {pendingOrders.length > 0 && (
          <div className='space-y-4'>
            <SectionHeader
              icon={Clock}
              title='Pendientes de pago'
              count={pendingOrders.length}
              variant='pending'
            />
            <div className='space-y-3'>
              {pendingOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}

        {/* Confirmed Orders */}
        {confirmedOrders.length > 0 && (
          <div className='space-y-4'>
            <SectionHeader
              icon={CheckCircle}
              title='Confirmadas'
              count={confirmedOrders.length}
              variant='confirmed'
            />
            <div className='space-y-3'>
              {confirmedOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}

        {/* Cancelled/Expired Orders */}
        {cancelledOrders.length > 0 && (
          <div className='space-y-4'>
            <SectionHeader
              icon={XCircle}
              title='Canceladas / Expiradas'
              count={cancelledOrders.length}
              variant='cancelled'
            />
            <div className='space-y-3'>
              {cancelledOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {hasNoOrders && <EmptyState />}
      </div>

      {/* Ticket View Modal */}
      {search.orden && (
        <TicketViewModal
          orderId={search.orden}
          open={modalOpen}
          onOpenChange={handleCloseModal}
        />
      )}
    </>
  );
}
