import {createFileRoute, useSearch, useNavigate} from '@tanstack/react-router';
import {z} from 'zod';
import {keepPreviousData, useQuery} from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {Button} from '~/components/ui/button';
import {Badge} from '~/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {Tabs, TabsList, TabsTrigger} from '~/components/ui/tabs';
import {adminPayoutsQueryOptions} from '~/lib/api/admin';
import {Landmark} from 'lucide-react';
import {formatCurrency} from '~/utils';
import {Skeleton} from '~/components/ui/skeleton';

const payoutsSearchSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
  sortBy: z
    .enum(['requestedAt', 'createdAt', 'amount', 'status'])
    .optional()
    .default('requestedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  status: z
    .enum([
      'pending',
      'processing',
      'completed',
      'failed',
      'cancelled',
    ])
    .optional(),
});

export const Route = createFileRoute('/admin/retiros/')({
  component: PayoutsPage,
  validateSearch: payoutsSearchSchema,
  loaderDeps: ({search}) => ({
    page: search.page ?? 1,
    limit: search.limit ?? 10,
    sortBy: search.sortBy ?? 'requestedAt',
    sortOrder: search.sortOrder ?? 'asc',
    status: search.status,
  }),
  // Prefetch in the loader, consume with useQuery in the component (same queryOptions).
  // Do not await: ensureQueryData would block while deps change (tabs/pagination) and the
  // root pendingComponent would show FullScreenLoading for the whole app.
  loader: ({context, deps}) => {
    void context.queryClient.prefetchQuery(adminPayoutsQueryOptions(deps));
  },
});

type FilterTab = 'all' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

function PayoutsTableSkeleton({rows = 8}: {rows?: number}) {
  return (
    <>
      {Array.from({length: rows}, (_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className='h-5 w-44' />
          </TableCell>
          <TableCell>
            <Skeleton className='h-5 w-28' />
          </TableCell>
          <TableCell>
            <Skeleton className='h-5 w-6' />
          </TableCell>
          <TableCell>
            <Skeleton className='h-5 w-36' />
          </TableCell>
          <TableCell>
            <Skeleton className='h-5 w-14' />
          </TableCell>
          <TableCell>
            <Skeleton className='h-5 w-24' />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function PayoutsPage() {
  const search = useSearch({from: '/admin/retiros/'});
  const navigate = useNavigate({from: '/admin/retiros/'});
  const queryParams = {
    page: search.page ?? 1,
    limit: search.limit ?? 10,
    sortBy: search.sortBy ?? 'requestedAt',
    sortOrder: search.sortOrder ?? 'asc',
    status: search.status,
  };

  const {data, isPlaceholderData, isPending} = useQuery({
    ...adminPayoutsQueryOptions(queryParams),
    placeholderData: keepPreviousData,
  });

  const tableIsLoading = isPlaceholderData || (isPending && !data);

  const activeTab: FilterTab = search.status ?? 'all';

  const setTab = (tab: FilterTab) => {
    navigate({
      search: prev => ({
        ...prev,
        status: tab === 'all' ? undefined : tab,
        page: 1,
      }),
    });
  };

  const getStatusBadgeProps = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          variant: 'outline' as const,
          className:
            'border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
        };
      case 'processing':
        return {
          variant: 'secondary' as const,
        };
      case 'completed':
        return {
          variant: 'outline' as const,
          className:
            'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400',
        };
      case 'failed':
        return {
          variant: 'destructive' as const,
        };
      case 'cancelled':
        return {
          variant: 'outline' as const,
        };
      default:
        return {
          variant: 'outline' as const,
        };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'processing':
        return 'Procesando';
      case 'completed':
        return 'Completado';
      case 'failed':
        return 'Fallido';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Retiros</h1>
        <p className='text-muted-foreground'>
          Gestiona y procesa las solicitudes de retiro de los publicadores
        </p>
      </div>

      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        {data ? (
          <>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Pendientes</CardDescription>
                <CardTitle className='text-2xl'>
                  {data.summary.pendingCount}
                </CardTitle>
              </CardHeader>
              <CardContent className='text-xs text-muted-foreground space-y-1'>
                <p>
                  UYU:{' '}
                  {formatCurrency(data.summary.pendingTotalUyu, 'UYU')}
                </p>
                <p>
                  USD:{' '}
                  {formatCurrency(data.summary.pendingTotalUsd, 'USD')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>En proceso</CardDescription>
                <CardTitle className='text-2xl'>
                  {data.summary.processingCount}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Fallidos</CardDescription>
                <CardTitle className='text-2xl'>
                  {data.summary.failedCount}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Completados (mes)</CardDescription>
                <CardTitle className='text-2xl'>
                  {data.summary.completedThisMonthCount}
                </CardTitle>
              </CardHeader>
              <CardContent className='text-xs text-muted-foreground space-y-1'>
                <p>
                  UYU:{' '}
                  {formatCurrency(
                    data.summary.completedThisMonthTotalUyu,
                    'UYU',
                  )}
                </p>
                <p>
                  USD:{' '}
                  {formatCurrency(
                    data.summary.completedThisMonthTotalUsd,
                    'USD',
                  )}
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {[0, 1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader className='pb-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='mt-2 h-8 w-16' />
                </CardHeader>
              </Card>
            ))}
          </>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={v => setTab(v as FilterTab)}
        className='w-full'
      >
        <TabsList className='flex h-auto flex-wrap justify-start gap-1'>
          <TabsTrigger value='all'>Todos</TabsTrigger>
          <TabsTrigger value='pending'>Pendientes</TabsTrigger>
          <TabsTrigger value='processing'>Procesando</TabsTrigger>
          <TabsTrigger value='completed'>Completados</TabsTrigger>
          <TabsTrigger value='failed'>Fallidos</TabsTrigger>
          <TabsTrigger value='cancelled'>Cancelados</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Solicitante</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Solicitado</TableHead>
              <TableHead>Antigüedad</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableIsLoading ? (
              <PayoutsTableSkeleton />
            ) : !data ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center'>
                  No se pudieron cargar los retiros
                </TableCell>
              </TableRow>
            ) : data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center'>
                  No se encontraron retiros
                </TableCell>
              </TableRow>
            ) : (
              data.data.map(payout => {
                const ageMs =
                  Date.now() - new Date(payout.requestedAt).getTime();
                const ageHours = Math.floor(ageMs / 3_600_000);
                const ageLabel =
                  ageHours < 1
                    ? '< 1 h'
                    : ageHours < 48
                      ? `${ageHours} h`
                      : `${Math.floor(ageHours / 24)} d`;

                return (
                  <TableRow
                    key={payout.id}
                    className='cursor-pointer hover:bg-muted/50'
                    onClick={() =>
                      navigate({
                        to: '/admin/retiros/$payoutId',
                        params: {payoutId: payout.id},
                      })
                    }
                  >
                    <TableCell>
                      {payout.seller
                        ? (() => {
                            const fullName =
                              `${payout.seller.firstName || ''} ${payout.seller.lastName || ''}`.trim();
                            if (fullName) {
                              return (
                                <>
                                  {fullName}{' '}
                                  <span className='text-muted-foreground text-xs'>
                                    ({payout.seller.email})
                                  </span>
                                </>
                              );
                            }
                            return payout.seller.email;
                          })()
                        : '—'}
                    </TableCell>
                    <TableCell className='font-medium tabular-nums'>
                      <div className='flex items-center gap-2'>
                        {formatCurrency(payout.amount, payout.currency)}
                        <Badge variant='outline' className='text-[10px]'>
                          {payout.currency}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Landmark className='h-4 w-4 text-muted-foreground' />
                    </TableCell>
                    <TableCell className='text-muted-foreground text-sm whitespace-nowrap'>
                      {new Date(payout.requestedAt).toLocaleString('es-UY', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {ageLabel}
                    </TableCell>
                    <TableCell>
                      <Badge {...getStatusBadgeProps(payout.status)}>
                        {getStatusLabel(payout.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>
          {tableIsLoading || !data ? (
            <Skeleton className='inline-block h-4 w-56' />
          ) : (
            <>
              Mostrando {data.data.length} de {data.pagination.total} retiros
            </>
          )}
        </p>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            disabled={tableIsLoading || !data || !data.pagination.hasPrev}
            onClick={() => {
              navigate({
                search: (prev: typeof search) => ({
                  ...prev,
                  page: (prev.page || 1) - 1,
                }),
              });
            }}
          >
            Anterior
          </Button>
          <Button
            variant='outline'
            disabled={tableIsLoading || !data || !data.pagination.hasNext}
            onClick={() => {
              navigate({
                search: (prev: typeof search) => ({
                  ...prev,
                  page: (prev.page || 1) + 1,
                }),
              });
            }}
          >
            Siguiente
          </Button>
        </div>
      </div>

      <p className='text-center text-sm text-muted-foreground'>
        Hacé clic en una fila para abrir el detalle, tipo de cambio y
        procesamiento.
      </p>
    </div>
  );
}
