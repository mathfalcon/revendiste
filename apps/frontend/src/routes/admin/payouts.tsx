import {createFileRoute, useSearch, useNavigate} from '@tanstack/react-router';
import {z} from 'zod';
import {useSuspenseQuery} from '@tanstack/react-query';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {adminPayoutsQueryOptions} from '~/lib/api/admin';
import {PayoutEditDialog} from '~/features/admin/payouts/PayoutEditDialog';
import {ProcessPayoutDialog} from '~/features/admin/payouts/ProcessPayoutDialog';
import {CancelPayoutDialog} from '~/features/admin/payouts/CancelPayoutDialog';
import {useState} from 'react';
import {MoreVertical} from 'lucide-react';

const payoutsSearchSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
  sortBy: z
    .enum(['requestedAt', 'createdAt', 'amount', 'status'])
    .optional()
    .default('requestedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']).optional(),
});

export const Route = createFileRoute('/admin/payouts')({
  component: PayoutsPage,
  validateSearch: payoutsSearchSchema,
  loaderDeps: ({search}) => ({
    page: search.page ?? 1,
    limit: search.limit ?? 10,
    sortBy: search.sortBy ?? 'requestedAt',
    sortOrder: search.sortOrder ?? 'asc',
    status: search.status,
  }),
  loader: ({context, deps}) => {
    return context.queryClient.ensureQueryData(adminPayoutsQueryOptions(deps));
  },
});

function PayoutsPage() {
  const search = useSearch({from: '/admin/payouts'});
  const navigate = useNavigate({from: '/admin/payouts'});
  const [editingPayoutId, setEditingPayoutId] = useState<string | null>(null);
  const [processingPayoutId, setProcessingPayoutId] = useState<string | null>(
    null,
  );
  const [cancellingPayoutId, setCancellingPayoutId] = useState<string | null>(
    null,
  );

  const {data} = useSuspenseQuery(
    adminPayoutsQueryOptions({
      page: search.page ?? 1,
      limit: search.limit ?? 10,
      sortBy: search.sortBy ?? 'requestedAt',
      sortOrder: search.sortOrder ?? 'asc',
      status: search.status,
    }),
  );

  const isPendingFilterActive = search.status === 'pending';

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

  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: currency === 'UYU' ? 'UYU' : 'USD',
    }).format(Number(amount));
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

  const hasAvailableActions = (status: string) => {
    // Actions are only available for pending status
    return status === 'pending';
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Pagos</h1>
          <p className='text-muted-foreground'>
            Gestiona y procesa las solicitudes de pago de los publicadores
          </p>
        </div>
        <Button
          variant={isPendingFilterActive ? 'default' : 'outline'}
          onClick={() => {
            navigate({
              search: (prev: typeof search) => ({
                ...prev,
                status: isPendingFilterActive ? undefined : 'pending',
                page: 1, // Reset to first page when filtering
              }),
            });
          }}
        >
          {isPendingFilterActive ? 'Mostrar Todos' : 'Solo Pendientes'}
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha de Solicitud</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center'>
                  No se encontraron pagos
                </TableCell>
              </TableRow>
            ) : (
              data.data.map(payout => (
                <TableRow key={payout.id}>
                  <TableCell className='font-mono text-xs'>
                    {payout.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {payout.seller
                      ? (() => {
                          const fullName =
                            `${payout.seller.firstName || ''} ${payout.seller.lastName || ''}`.trim();
                          if (fullName) {
                            return (
                              <>
                                {fullName}{' '}
                                <span className='text-muted-foreground'>
                                  ({payout.seller.email})
                                </span>
                              </>
                            );
                          }
                          return payout.seller.email;
                        })()
                      : 'Desconocido'}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(payout.amount, payout.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge {...getStatusBadgeProps(payout.status)}>
                      {getStatusLabel(payout.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(payout.requestedAt).toLocaleString('es-UY', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>
                    {hasAvailableActions(payout.status) ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className='rounded-sm p-1 hover:bg-accent focus:outline-none'>
                            <MoreVertical className='h-4 w-4' />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          {payout.status === 'pending' && (
                            <DropdownMenuItem
                              onClick={() => setProcessingPayoutId(payout.id)}
                            >
                              Procesar
                            </DropdownMenuItem>
                          )}
                          {payout.status === 'pending' && (
                            <DropdownMenuItem
                              className='text-red-600'
                              onClick={() => setCancellingPayoutId(payout.id)}
                            >
                              Cancelar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className='text-muted-foreground text-sm'>—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className='flex items-center justify-between'>
        <div className='text-sm text-muted-foreground'>
          Mostrando {data.data.length} de {data.pagination.total} pagos
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            disabled={!data.pagination.hasPrev}
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
            disabled={!data.pagination.hasNext}
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

      {editingPayoutId && (
        <PayoutEditDialog
          payoutId={editingPayoutId}
          open={!!editingPayoutId}
          onOpenChange={open => !open && setEditingPayoutId(null)}
        />
      )}
      {processingPayoutId && (
        <ProcessPayoutDialog
          payoutId={processingPayoutId}
          open={!!processingPayoutId}
          onOpenChange={open => !open && setProcessingPayoutId(null)}
        />
      )}
      {cancellingPayoutId && (
        <CancelPayoutDialog
          payoutId={cancellingPayoutId}
          open={!!cancellingPayoutId}
          onOpenChange={open => !open && setCancellingPayoutId(null)}
        />
      )}
    </div>
  );
}
