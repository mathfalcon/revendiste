import {useQuery, useQueryClient, useIsFetching} from '@tanstack/react-query';
import {
  AlertTriangle,
  Banknote,
  BarChart3,
  CalendarDays,
  Coins,
  CreditCard,
  DollarSign,
  Inbox,
  LayoutGrid,
  ListTodo,
  RefreshCw,
  ShoppingCart,
  Ticket,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import {Button} from '~/components/ui/button';
import {Alert, AlertDescription, AlertTitle} from '~/components/ui/alert';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {formatCurrency} from '~/utils';
import {
  adminDashboardTicketsQueryOptions,
  adminDashboardRevenueQueryOptions,
  adminDashboardOrdersQueryOptions,
  adminDashboardPayoutsQueryOptions,
  adminDashboardHealthQueryOptions,
  adminDashboardTopEventsQueryOptions,
  adminDashboardRevenueTimeSeriesQueryOptions,
  adminDashboardOrdersTimeSeriesQueryOptions,
  adminDashboardTicketsTimeSeriesQueryOptions,
  adminDashboardRevenueByOrderCurrencyQueryOptions,
} from '~/lib/api/admin';
import {MoneyFlowSankey} from './charts/MoneyFlowSankey';
import {RevenueAreaChart} from './charts/RevenueAreaChart';
import {OrdersAreaChart} from './charts/OrdersAreaChart';
import {TicketsAreaChart} from './charts/TicketsAreaChart';
import {StatCard} from './StatCard';
import {DashboardPeriodSelector} from './DashboardPeriodSelector';
import {CurrencyBreakdownSection} from './CurrencyBreakdownSection';
import {
  buildAdminDashboardApiQuery,
  type DashboardSearch,
} from './dashboard-params';
import type {GetDashboardRevenueResponse} from '~/lib/api/generated';
import {formatDistanceToNow} from 'date-fns';
import {es} from 'date-fns/locale';
import {cn} from '~/lib/utils';

function formatDashboardPercent(value: number) {
  return `${value.toLocaleString('es-UY', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

const REVENUE_PARTY_LABEL_ES: Record<string, string> = {
  buyer: 'Comprador',
  seller: 'Vendedor',
};

function formatRevenuePartyBreakdownDescription(
  revenue: GetDashboardRevenueResponse,
): string | undefined {
  const parties = revenue.revenueByParty;
  if (!parties || Object.keys(parties).length === 0) {
    return undefined;
  }
  const parts: string[] = [];
  for (const [key, amounts] of Object.entries(parties)) {
    const label = REVENUE_PARTY_LABEL_ES[key] ?? key;
    const total = parseFloat(amounts.base) + parseFloat(amounts.vat);
    if (!Number.isFinite(total) || total === 0) {
      continue;
    }
    parts.push(`${label}: ${formatCurrency(String(total), revenue.currency)}`);
  }
  if (parts.length === 0) {
    return undefined;
  }
  return parts.join(' · ');
}

type Props = {
  search: DashboardSearch;
  onNavigateSearch: (next: Partial<DashboardSearch>) => void;
};

export function DashboardPage({search, onNavigateSearch}: Props) {
  const apiQuery = buildAdminDashboardApiQuery(search);
  const queryClient = useQueryClient();

  const ticketsQ = useQuery(adminDashboardTicketsQueryOptions(apiQuery));
  const revenueQ = useQuery(adminDashboardRevenueQueryOptions(apiQuery));
  const ordersQ = useQuery(adminDashboardOrdersQueryOptions(apiQuery));
  const payoutsQ = useQuery(adminDashboardPayoutsQueryOptions(apiQuery));
  const healthQ = useQuery(adminDashboardHealthQueryOptions());
  const topEventsQ = useQuery(adminDashboardTopEventsQueryOptions(apiQuery));
  const revenueTsQ = useQuery(
    adminDashboardRevenueTimeSeriesQueryOptions(apiQuery),
  );
  const ordersTsQ = useQuery(
    adminDashboardOrdersTimeSeriesQueryOptions(apiQuery),
  );
  const ticketsTsQ = useQuery(
    adminDashboardTicketsTimeSeriesQueryOptions(apiQuery),
  );
  const revenueByOrderCurrencyQ = useQuery(
    adminDashboardRevenueByOrderCurrencyQueryOptions(apiQuery),
  );

  const fetchingCount = useIsFetching({queryKey: ['admin', 'dashboard']});

  const lastUpdated = Math.max(
    ticketsQ.dataUpdatedAt,
    revenueQ.dataUpdatedAt,
    ordersQ.dataUpdatedAt,
    payoutsQ.dataUpdatedAt,
    healthQ.dataUpdatedAt,
    topEventsQ.dataUpdatedAt,
    revenueTsQ.dataUpdatedAt,
    ordersTsQ.dataUpdatedAt,
    ticketsTsQ.dataUpdatedAt,
    revenueByOrderCurrencyQ.dataUpdatedAt,
  );

  const handleReload = () => {
    void queryClient.invalidateQueries({queryKey: ['admin', 'dashboard']});
  };

  const handlePreset = (periodo: DashboardSearch['periodo']) => {
    onNavigateSearch({periodo, desde: undefined, hasta: undefined});
  };

  const handleRange = (desde: string, hasta: string) => {
    onNavigateSearch({desde, hasta, periodo: search.periodo});
  };

  return (
    <div className='space-y-8 pt-14 md:pt-0'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Panel</h1>
        </div>

        <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
          <DashboardPeriodSelector
            search={search}
            onChangePreset={handlePreset}
            onChangeRange={handleRange}
          />
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='cursor-pointer'
              onClick={handleReload}
              disabled={fetchingCount > 0}
              aria-label='Actualizar datos'
            >
              <RefreshCw
                className={cn(
                  'mr-2 h-4 w-4',
                  fetchingCount > 0 && 'animate-spin',
                )}
                aria-hidden
              />
              Actualizar
            </Button>
            <span
              className='flex items-center gap-2 text-xs text-muted-foreground'
              aria-live='polite'
            >
              <span
                className='inline-block h-2 w-2 rounded-full bg-green-500 motion-safe:animate-pulse'
                aria-hidden
              />
              {lastUpdated > 0
                ? `Actualizado ${formatDistanceToNow(lastUpdated, {addSuffix: true, locale: es})}`
                : 'Cargando…'}
            </span>
          </div>
        </div>
      </div>

      <section
        className='space-y-4'
        aria-labelledby='dashboard-ingresos-heading'
      >
        <div>
          <h2 id='dashboard-ingresos-heading' className='text-lg font-semibold'>
            Ingresos
          </h2>
          <p className='text-sm text-muted-foreground'>
            Montos del periodo seleccionado y evolución diaria del desglose.
          </p>
        </div>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5'>
          <StatCard
            title='GMV (órdenes confirmadas)'
            value={
              revenueQ.data
                ? formatCurrency(revenueQ.data.gmv, revenueQ.data.currency)
                : '—'
            }
            icon={DollarSign}
            isLoading={revenueQ.isPending}
            accentClassName='border-l-amber-500'
            description={
              revenueQ.data?.mixedCurrency
                ? 'Varias monedas: totales sumados (revisar desglose)'
                : undefined
            }
          />
          <StatCard
            title='Comisión + IVA (plataforma)'
            value={
              revenueQ.data
                ? formatCurrency(
                    (
                      parseFloat(revenueQ.data.platformRevenue) +
                      parseFloat(revenueQ.data.vatOnRevenue)
                    ).toString(),
                    revenueQ.data.currency,
                  )
                : '—'
            }
            icon={Banknote}
            isLoading={revenueQ.isPending}
            accentClassName='border-l-violet-500'
            description={
              revenueQ.data
                ? formatRevenuePartyBreakdownDescription(revenueQ.data)
                : undefined
            }
          />
          <StatCard
            title='Fees procesador'
            value={
              revenueQ.data
                ? formatCurrency(
                    revenueQ.data.processorFees,
                    revenueQ.data.currency,
                  )
                : '—'
            }
            icon={CreditCard}
            isLoading={revenueQ.isPending}
            accentClassName='border-l-orange-500'
            description={
              revenueQ.data
                ? `${formatDashboardPercent(
                    revenueQ.data.processorFeesPercentOfCommissionAndVat,
                  )} de comisión + IVA (plataforma)`
                : undefined
            }
          />
          <StatCard
            title='Ingreso neto plataforma'
            value={
              revenueQ.data
                ? formatCurrency(
                    revenueQ.data.netPlatformIncome,
                    revenueQ.data.currency,
                  )
                : '—'
            }
            icon={Wallet}
            isLoading={revenueQ.isPending}
            accentClassName='border-l-green-600'
            description={
              revenueQ.data
                ? `${formatDashboardPercent(
                    revenueQ.data.netPlatformIncomePercentOfCommissionAndVat,
                  )} de comisión + IVA (plataforma)`
                : undefined
            }
          />
          <StatCard
            title='Ingreso neto tras IVA empresa'
            value={
              revenueQ.data
                ? formatCurrency(
                    revenueQ.data.netPlatformIncomeAfterIncomeVat,
                    revenueQ.data.currency,
                  )
                : '—'
            }
            icon={Coins}
            isLoading={revenueQ.isPending}
            accentClassName='border-l-teal-600'
            description={
              revenueQ.data
                ? parseFloat(revenueQ.data.netPlatformIncome) > 0
                  ? `IVA estimado ${formatCurrency(
                      revenueQ.data.platformIncomeVatAmount,
                      revenueQ.data.currency,
                    )} (${Math.round(
                      revenueQ.data.platformIncomeVatRate * 100,
                    )}% sobre ingreso neto; tasa según configuración)`
                  : 'Sin IVA estimado cuando el ingreso neto no es positivo'
                : undefined
            }
          />
        </div>
        {revenueQ.data && revenueQ.data.ordersMissingInvoices > 0 ? (
          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' aria-hidden />
            <AlertTitle>Facturación pendiente</AlertTitle>
            <AlertDescription>
              {revenueQ.data.ordersMissingInvoices === 1
                ? 'Hay 1 pedido con comisión en el pedido pero sin facturas emitidas en FEU (el ingreso por comisión puede estar incompleto hasta que se emitan).'
                : `Hay ${revenueQ.data.ordersMissingInvoices} pedidos con comisión en el pedido pero sin facturas emitidas en FEU (el ingreso por comisión puede estar incompleto hasta que se emitan).`}
            </AlertDescription>
          </Alert>
        ) : null}
        <div className='grid grid-cols-1 gap-6'>
          <CurrencyBreakdownSection
            data={revenueByOrderCurrencyQ.data}
            isLoading={revenueByOrderCurrencyQ.isPending}
          />
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Flujo de dinero</CardTitle>
              <p className='text-sm text-muted-foreground'>
                Desde el total pagado por compradores hasta el neto estimado
                tras IVA empresa, para el periodo seleccionado.
              </p>
            </CardHeader>
            <CardContent>
              <MoneyFlowSankey
                revenue={revenueQ.data}
                isLoading={revenueQ.isPending}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>
                Desglose de ingresos por día
              </CardTitle>
              <p className='text-sm text-muted-foreground'>
                Cada día: fees del procesador, IVA empresa estimado y neto tras
                IVA (órdenes confirmadas con pago). Leyenda y tooltip indican
                qué capa es cada valor.
              </p>
            </CardHeader>
            <CardContent>
              <RevenueAreaChart
                data={revenueTsQ.data}
                isLoading={revenueTsQ.isPending}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <section
        className='space-y-4'
        aria-labelledby='dashboard-entradas-heading'
      >
        <div>
          <h2 id='dashboard-entradas-heading' className='text-lg font-semibold'>
            Entradas
          </h2>
          <p className='text-sm text-muted-foreground'>
            Stock y ventas en el periodo; la gráfica compara publicadas vs
            vendidas por día.
          </p>
        </div>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <StatCard
            title='Publicadas (eventos activos)'
            value={ticketsQ.data?.publishedActiveEvents ?? '—'}
            icon={Ticket}
            isLoading={ticketsQ.isPending}
            accentClassName='border-l-blue-500'
          />
          <StatCard
            title='Publicadas (rango)'
            value={ticketsQ.data?.publishedTotal ?? '—'}
            icon={LayoutGrid}
            isLoading={ticketsQ.isPending}
            accentClassName='border-l-blue-400'
          />
          <StatCard
            title='Vendidas (rango)'
            value={ticketsQ.data?.sold ?? '—'}
            icon={TrendingUp}
            isLoading={ticketsQ.isPending}
            accentClassName='border-l-emerald-500'
          />
          <StatCard
            title='Listados activos'
            value={ticketsQ.data?.activeListings ?? '—'}
            icon={BarChart3}
            isLoading={ticketsQ.isPending}
            accentClassName='border-l-cyan-500'
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>
              Entradas publicadas vs vendidas por día
            </CardTitle>
            <p className='text-sm text-muted-foreground'>
              Publicadas por fecha de alta; vendidas por fecha de venta.
            </p>
          </CardHeader>
          <CardContent>
            <TicketsAreaChart
              data={ticketsTsQ.data}
              isLoading={ticketsTsQ.isPending}
            />
          </CardContent>
        </Card>
      </section>

      <section
        className='space-y-4'
        aria-labelledby='dashboard-ordenes-pagos-heading'
      >
        <div>
          <h2
            id='dashboard-ordenes-pagos-heading'
            className='text-lg font-semibold'
          >
            Órdenes y pagos
          </h2>
          <p className='text-sm text-muted-foreground'>
            Conteos del periodo y evolución diaria de órdenes nuevas por estado.
          </p>
        </div>
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <ShoppingCart className='h-4 w-4' aria-hidden />
                Órdenes
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-2 gap-3 text-sm'>
              <div>
                <p className='text-muted-foreground'>Pendientes</p>
                <p className='text-xl font-semibold'>
                  {ordersQ.isPending ? '—' : ordersQ.data?.pending}
                </p>
              </div>
              <div>
                <p className='text-muted-foreground'>Confirmadas</p>
                <p className='text-xl font-semibold'>
                  {ordersQ.isPending ? '—' : ordersQ.data?.confirmed}
                </p>
              </div>
              <div>
                <p className='text-muted-foreground'>Expiradas (órdenes)</p>
                <p className='text-xl font-semibold'>
                  {ordersQ.isPending ? '—' : ordersQ.data?.expired}
                </p>
              </div>
              <div>
                <p className='text-muted-foreground'>Canceladas</p>
                <p className='text-xl font-semibold'>
                  {ordersQ.isPending ? '—' : ordersQ.data?.cancelled}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <CreditCard className='h-4 w-4' aria-hidden />
                Pagos
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-2 gap-3 text-sm'>
              <div>
                <p className='text-muted-foreground'>Exitosos</p>
                <p className='text-xl font-semibold'>
                  {ordersQ.isPending ? '—' : ordersQ.data?.payments.successful}
                </p>
              </div>
              <div>
                <p className='text-muted-foreground'>Fallidos</p>
                <p className='text-xl font-semibold'>
                  {ordersQ.isPending ? '—' : ordersQ.data?.payments.failed}
                </p>
              </div>
              <div>
                <p className='text-muted-foreground'>Expirados</p>
                <p className='text-xl font-semibold'>
                  {ordersQ.isPending ? '—' : ordersQ.data?.payments.expired}
                </p>
              </div>
              <div>
                <p className='text-muted-foreground'>Conversión (pagos)</p>
                <p className='text-xl font-semibold'>
                  {ordersQ.isPending
                    ? '—'
                    : `${ordersQ.data?.payments.conversionRate ?? 0}%`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Órdenes por día</CardTitle>
            <p className='text-sm text-muted-foreground'>
              Nuevas órdenes por fecha de creación, apiladas por estado. La
              leyenda y el tooltip muestran el color y el nombre de cada estado.
            </p>
          </CardHeader>
          <CardContent>
            <OrdersAreaChart
              data={ordersTsQ.data}
              isLoading={ordersTsQ.isPending}
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Wallet className='h-4 w-4' aria-hidden />
            Retiros y ganancias de vendedores
          </CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm'>
          <div>
            <p className='text-muted-foreground'>Retiros pendientes</p>
            <p className='text-xl font-semibold'>
              {payoutsQ.isPending ? '—' : payoutsQ.data?.pendingCount}
            </p>
            <p className='text-muted-foreground'>
              {payoutsQ.data
                ? formatCurrency(
                    payoutsQ.data.pendingAmount,
                    payoutsQ.data.currency,
                  )
                : null}
            </p>
          </div>
          <div>
            <p className='text-muted-foreground'>Retiros completados (rango)</p>
            <p className='text-xl font-semibold'>
              {payoutsQ.isPending ? '—' : payoutsQ.data?.completedCount}
            </p>
            <p className='text-muted-foreground'>
              {payoutsQ.data
                ? formatCurrency(
                    payoutsQ.data.completedAmount,
                    payoutsQ.data.currency,
                  )
                : null}
            </p>
          </div>
          <div>
            <p className='text-muted-foreground'>Disponibles / retenidas</p>
            <p className='mt-1'>
              {payoutsQ.data
                ? formatCurrency(
                    payoutsQ.data.availableEarnings,
                    payoutsQ.data.currency,
                  )
                : '—'}{' '}
              /{' '}
              {payoutsQ.data
                ? formatCurrency(
                    payoutsQ.data.retainedEarnings,
                    payoutsQ.data.currency,
                  )
                : '—'}
            </p>
          </div>
        </CardContent>
      </Card>

      <section className='space-y-3' aria-labelledby='dashboard-health-heading'>
        <h2 id='dashboard-health-heading' className='text-lg font-semibold'>
          Salud de la plataforma
        </h2>
        <p className='text-sm text-muted-foreground'>
          Indicadores operativos sin filtro de fecha (estado actual).
        </p>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          <StatCard
            title='Usuarios registrados'
            value={healthQ.isPending ? '—' : healthQ.data?.totalUsers}
            icon={Users}
            isLoading={healthQ.isPending}
            accentClassName='border-l-slate-500'
          />
          <StatCard
            title='Nuevos usuarios (24 h)'
            value={healthQ.isPending ? '—' : healthQ.data?.newUsers}
            icon={UserPlus}
            isLoading={healthQ.isPending}
            accentClassName='border-l-sky-500'
          />
          <StatCard
            title='Verificaciones en revisión manual'
            value={healthQ.isPending ? '—' : healthQ.data?.pendingVerifications}
            icon={AlertTriangle}
            isLoading={healthQ.isPending}
            accentClassName='border-l-amber-500'
            description={
              healthQ.data && healthQ.data.pendingVerifications > 0
                ? 'Requieren acción del equipo'
                : undefined
            }
          />
          <StatCard
            title='Reportes de entradas abiertos'
            value={healthQ.isPending ? '—' : healthQ.data?.openTicketReports}
            icon={Inbox}
            isLoading={healthQ.isPending}
            accentClassName='border-l-rose-500'
          />
          <StatCard
            title='Jobs pendientes o en proceso'
            value={healthQ.isPending ? '—' : healthQ.data?.pendingJobs}
            icon={ListTodo}
            isLoading={healthQ.isPending}
            accentClassName='border-l-violet-500'
          />
          <StatCard
            title='Eventos activos (futuros)'
            value={healthQ.isPending ? '—' : healthQ.data?.activeEvents}
            icon={CalendarDays}
            isLoading={healthQ.isPending}
            accentClassName='border-l-emerald-600'
          />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Top eventos por ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead className='text-right'>
                    Entradas vendidas
                  </TableHead>
                  <TableHead className='text-right'>GMV</TableHead>
                  <TableHead className='text-right'>Listados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topEventsQ.isPending ? (
                  <TableRow>
                    <TableCell colSpan={4} className='text-center'>
                      Cargando…
                    </TableCell>
                  </TableRow>
                ) : !topEventsQ.data?.events?.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className='text-center'>
                      Sin datos en este rango
                    </TableCell>
                  </TableRow>
                ) : (
                  topEventsQ.data.events.map(row => (
                    <TableRow key={row.eventId}>
                      <TableCell className='font-medium'>
                        {row.eventName}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {row.ticketsSold}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {formatCurrency(
                          row.revenue,
                          revenueQ.data?.currency ?? 'UYU',
                        )}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {row.listingCount}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
