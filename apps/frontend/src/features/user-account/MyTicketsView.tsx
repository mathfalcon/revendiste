import {useState, useEffect} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useSearch, useNavigate} from '@tanstack/react-router';
import {getMyOrdersQuery} from '~/lib';
import {OrderCard, TicketViewModal} from '~/components';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {CheckCircle, XCircle, Clock} from 'lucide-react';
import {LoadingSpinner} from '~/components/LoadingScreen';
import {Card, CardContent} from '~/components/ui/card';

export function MyTicketsView() {
  const {data: orders, isPending} = useQuery(getMyOrdersQuery());
  const search = useSearch({from: '/cuenta/tickets'});
  const navigate = useNavigate({from: '/cuenta/tickets'});
  const [modalOpen, setModalOpen] = useState(false);

  // Auto-open modal when orden parameter is present
  useEffect(() => {
    if (search.orden) {
      setModalOpen(true);
    }
  }, [search.orden]);

  const handleCloseModal = () => {
    setModalOpen(false);
    // Remove the query parameter when closing
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

  if (!orders || orders.length === 0) {
    return (
      <div className='flex h-96 items-center justify-center rounded-lg border bg-card p-6 text-card-foreground shadow-sm'>
        <div className='text-center'>
          <p className='text-lg font-semibold'>No hay órdenes</p>
          <p className='text-muted-foreground'>
            No has realizado ninguna compra aún
          </p>
        </div>
      </div>
    );
  }

  // Separate orders by status
  const pendingOrders = orders.filter(order => order.status === 'pending');
  const confirmedOrders = orders.filter(order => order.status === 'confirmed');
  const cancelledOrders = orders.filter(
    order => order.status === 'cancelled' || order.status === 'expired',
  );

  return (
    <>
      <div className='space-y-6'>
        <div>
          <h2 className='text-2xl font-semibold'>Mis tickets</h2>
          <p className='text-muted-foreground'>
            Accede a tus tickets en cualquier momento
          </p>
        </div>

        <Accordion
          type='multiple'
          defaultValue={['pending', 'confirmed']}
          className='w-full flex flex-col gap-4'
        >
          {/* Pending Orders */}
          {pendingOrders.length > 0 && (
            <AccordionItem value='pending' className='border-none'>
              <AccordionTrigger className='rounded-lg border bg-card px-4 py-3 hover:no-underline'>
                <div className='flex items-center gap-2'>
                  <Clock className='h-4 w-4 text-yellow-500' />
                  <span className='font-semibold'>
                    Órdenes pendientes ({pendingOrders.length})
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className='pt-4'>
                <div className='space-y-4'>
                  {pendingOrders.map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Confirmed Orders */}
          <AccordionItem value='confirmed' className='border-none'>
            <AccordionTrigger className='rounded-lg border bg-card px-4 py-3 hover:no-underline'>
              <div className='flex items-center gap-2'>
                <CheckCircle className='h-4 w-4 text-green-500' />
                <span className='font-semibold'>
                  Órdenes confirmadas ({confirmedOrders.length})
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className='pt-4'>
              {confirmedOrders.length > 0 ? (
                <div className='space-y-4'>
                  {confirmedOrders.map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              ) : (
                <p className='py-8 text-center text-muted-foreground'>
                  No tienes órdenes confirmadas
                </p>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Cancelled/Expired Orders */}
          <AccordionItem value='cancelled' className='border-none'>
            <AccordionTrigger className='rounded-lg border bg-card px-4 py-3 hover:no-underline'>
              <div className='flex items-center gap-2'>
                <XCircle className='h-4 w-4 text-red-500' />
                <span className='font-semibold'>
                  Órdenes canceladas/expiradas ({cancelledOrders.length})
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className='pt-4'>
              {cancelledOrders.length > 0 ? (
                <div className='space-y-4'>
                  {cancelledOrders.map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              ) : (
                <p className='py-8 text-center text-muted-foreground'>
                  No tienes órdenes canceladas o expiradas
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
