import {createFileRoute, useSearch, useNavigate} from '@tanstack/react-router';
import {z} from 'zod';
import {useSuspenseQuery, useQuery} from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {Badge} from '~/components/ui/badge';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {adminSettlementsQueryOptions} from '~/lib/api/admin';
import {formatCurrency} from '~/utils';

const settlementsSearchSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
  sortBy: z
    .enum(['settlementDate', 'createdAt', 'totalAmount', 'status'])
    .optional()
    .default('settlementDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z.enum(['pending', 'completed', 'failed']).optional(),
});

export const Route = createFileRoute('/admin/finanzas')({
  component: FinanzasPage,
  validateSearch: settlementsSearchSchema,
  loaderDeps: ({search}) => ({
    page: search.page ?? 1,
    limit: search.limit ?? 10,
    sortBy: search.sortBy ?? 'settlementDate',
    sortOrder: search.sortOrder ?? 'desc',
    status: search.status,
  }),
  loader: ({context, deps}) => {
    return context.queryClient.ensureQueryData(adminSettlementsQueryOptions(deps));
  },
});

function FinanzasPage() {
  const search = useSearch({from: '/admin/finanzas'});
  const navigate = useNavigate({from: '/admin/finanzas'});

  const {data} = useSuspenseQuery(
    adminSettlementsQueryOptions({
      page: search.page ?? 1,
      limit: search.limit ?? 10,
      sortBy: search.sortBy ?? 'settlementDate',
      sortOrder: search.sortOrder ?? 'desc',
      status: search.status,
    }),
  );

  const getStatusBadgeProps = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          variant: 'outline' as const,
          className:
            'border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
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
      case 'completed':
        return 'Completada';
      case 'failed':
        return 'Fallida';
      default:
        return status;
    }
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Finanzas</h1>
        <p className='text-muted-foreground'>
          Liquidaciones por procesador de pagos (reconciliación y seguimiento)
        </p>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Liquidaciones Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {data?.data?.filter((s: any) => s.status === 'pending').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Liquidaciones Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {data?.data?.filter((s: any) => s.status === 'completed').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Monto Total Liquidado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {(() => {
                const total = data?.data?.reduce((sum: number, s: any) => {
                  if (s.status === 'completed') {
                    return sum + parseFloat(s.totalAmount);
                  }
                  return sum;
                }, 0);

                if (!total) return 'UYU 0';

                // Determine currency from first completed settlement
                const firstCompleted = data?.data?.find(
                  (s: any) => s.status === 'completed',
                );
                const currency = firstCompleted?.currency || 'UYU';

                return formatCurrency(total.toString(), currency);
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settlements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liquidaciones del procesador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Procesador</TableHead>
                  <TableHead>ID de Liquidación</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data && data.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className='text-center'>
                      No se encontraron liquidaciones
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data?.map((settlement: any) => (
                    <TableRow key={settlement.id}>
                      <TableCell className='text-sm capitalize'>
                        {settlement.paymentProvider ?? '—'}
                      </TableCell>
                      <TableCell className='font-mono text-xs'>
                        {settlement.settlementId.slice(0, 12)}...
                      </TableCell>
                      <TableCell>
                        {new Date(settlement.settlementDate).toLocaleDateString(
                          'es-UY',
                        )}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(settlement.totalAmount, settlement.currency)}
                      </TableCell>
                      <TableCell>{settlement.currency}</TableCell>
                      <TableCell>
                        <Badge {...getStatusBadgeProps(settlement.status)}>
                          {getStatusLabel(settlement.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(settlement.createdAt).toLocaleString('es-UY', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className='flex items-center justify-between mt-4'>
            <div className='text-sm text-muted-foreground'>
              Mostrando {data?.data?.length || 0} de {data?.pagination?.total || 0}{' '}
              liquidaciones
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
