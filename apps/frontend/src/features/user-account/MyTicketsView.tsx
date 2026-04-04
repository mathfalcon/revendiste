import {useState, useEffect} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useSearch, useNavigate} from '@tanstack/react-router';
import {getMyOrdersQuery} from '~/lib';
import {OrderCard, TicketViewModal} from '~/components';
import {AccountSectionHeader, AccountEmptyState} from '~/features/user-account';
import {CheckCircle, XCircle, Clock, QrCode} from 'lucide-react';
import {LoadingSpinner} from '~/components/LoadingScreen';
import {Card, CardContent} from '~/components/ui/card';
import {Link} from '@tanstack/react-router';

export function MyTicketsView() {
  const {data: orders, isPending} = useQuery(getMyOrdersQuery());
  const search = useSearch({from: '/cuenta/entradas'});
  const navigate = useNavigate({from: '/cuenta/entradas'});
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
          <h2 className='text-2xl font-semibold'>Mis entradas</h2>
          <p className='text-muted-foreground'>
            Accedé a tus órdenes en cualquier momento
          </p>
        </div>

        {/* Pending Orders */}
        {pendingOrders.length > 0 && (
          <div className='space-y-4'>
            <AccountSectionHeader
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
            <AccountSectionHeader
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
            <AccountSectionHeader
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
        {hasNoOrders && (
          <AccountEmptyState
            icon={<QrCode className='h-8 w-8 text-muted-foreground' />}
            title='No tenés órdenes'
            description='Cuando compres entradas, aparecerán acá para que puedas acceder a ellas.'
            action={
              <Link
                to='/'
                className='inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors'
              >
                Explorar eventos
              </Link>
            }
          />
        )}
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
