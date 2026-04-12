import {useState, useEffect, type ComponentProps} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useSearch, useNavigate} from '@tanstack/react-router';
import {getMyOrdersQuery} from '~/lib';
import {OrderCard, TicketViewModal} from '~/components';
import {AccountSectionHeader, AccountEmptyState} from '~/features/user-account';
import {CheckCircle, XCircle, Clock, QrCode, History} from 'lucide-react';
import {LoadingSpinner} from '~/components/LoadingScreen';
import {Card, CardContent} from '~/components/ui/card';
import {Link} from '@tanstack/react-router';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {cn} from '~/lib/utils';

type OrderForCard = ComponentProps<typeof OrderCard>['order'];

function isPastEventOrder(order: {
  event?: {
    eventEndDate?: string | null;
    eventStartDate?: string | null;
  };
}): boolean {
  const end = order.event?.eventEndDate;
  const start = order.event?.eventStartDate;
  const boundary = end ?? start;
  if (!boundary) return false;
  return new Date(boundary).getTime() < Date.now();
}

function OrdersGroupedByStatus({orders}: {orders: OrderForCard[]}) {
  const pendingOrders = orders.filter(order => order.status === 'pending');
  const confirmedOrders = orders.filter(order => order.status === 'confirmed');
  const cancelledOrders = orders.filter(
    order => order.status === 'cancelled' || order.status === 'expired',
  );

  return (
    <>
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
    </>
  );
}

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

  const allOrders = (orders ?? []) as OrderForCard[];
  const upcomingOrders = allOrders.filter(order => !isPastEventOrder(order));
  const pastOrders = allOrders.filter(isPastEventOrder);
  const pastOrdersCount = pastOrders.length;
  const hasPastOrders = pastOrdersCount > 0;
  const hasUpcomingOrders = upcomingOrders.length > 0;

  const hasNoOrdersAtAll = allOrders.length === 0;
  const onlyPastOrders = hasPastOrders && !hasUpcomingOrders;

  return (
    <>
      <div className='space-y-6'>
        <div>
          <h2 className='text-2xl font-semibold'>Mis entradas</h2>
          <p className='text-muted-foreground'>
            Accedé a tus órdenes en cualquier momento
          </p>
          {onlyPastOrders ? (
            <p className='mt-2 text-sm text-muted-foreground'>
              Todas tus órdenes son de eventos que ya ocurrieron. Podés colapsar
              la sección si preferís.
            </p>
          ) : null}
        </div>

        {hasUpcomingOrders ? (
          <OrdersGroupedByStatus orders={upcomingOrders} />
        ) : null}

        {hasPastOrders ? (
          <Accordion
            type='single'
            collapsible
            defaultValue={onlyPastOrders ? 'past' : undefined}
            className='w-full rounded-lg border border-border bg-card px-4'
          >
            <AccordionItem value='past' className='border-b-0'>
              <AccordionTrigger
                className={cn(
                  'py-4 hover:no-underline',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md',
                )}
              >
                <span className='flex min-w-0 flex-1 items-center gap-2 text-left'>
                  <History
                    className='h-5 w-5 shrink-0 text-muted-foreground'
                    aria-hidden
                  />
                  <span className='text-lg font-semibold'>Eventos pasados</span>
                  <span
                    className='rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-muted-foreground'
                    aria-label={`${pastOrdersCount} órdenes`}
                  >
                    {pastOrdersCount}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className='space-y-6 border-t border-border pt-2'>
                  <OrdersGroupedByStatus orders={pastOrders} />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : null}

        {hasNoOrdersAtAll && (
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
