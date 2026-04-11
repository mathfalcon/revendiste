import {Link} from '@tanstack/react-router';
import {useSuspenseQuery} from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {Badge} from '~/components/ui/badge';
import {Button} from '~/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {adminSettlementBreakdownQueryOptions} from '~/lib/api/admin';
import {formatCurrency} from '~/utils';
import {ArrowLeft} from 'lucide-react';

interface SettlementDetailPageProps {
  settlementId: string;
}

export function SettlementDetailPage({settlementId}: SettlementDetailPageProps) {
  const {data} = useSuspenseQuery(
    adminSettlementBreakdownQueryOptions(settlementId),
  );

  const {settlement, reconciliation, items} = data;

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
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <Button variant='outline' size='icon' asChild>
            <Link to='/admin/finanzas'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <div>
            <h1 className='text-2xl font-bold'>Liquidación</h1>
            <p className='font-mono text-sm text-muted-foreground'>
              {settlement.settlementId}
            </p>
          </div>
        </div>
        <Badge variant='outline' className='w-fit capitalize'>
          {settlement.paymentProvider} · {getStatusLabel(settlement.status)}
        </Badge>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Fecha de liquidación
            </CardTitle>
          </CardHeader>
          <CardContent>
            {new Date(settlement.settlementDate).toLocaleDateString('es-UY', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Monto declarado
            </CardTitle>
          </CardHeader>
          <CardContent className='text-xl font-semibold'>
            {formatCurrency(settlement.totalAmount, settlement.currency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Pagos conciliados
            </CardTitle>
          </CardHeader>
          <CardContent className='text-xl font-semibold'>
            {reconciliation.paymentCount}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de conciliación</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-2 sm:grid-cols-2'>
          <div className='flex justify-between gap-4 border-b pb-2'>
            <span className='text-muted-foreground'>Cobrado a compradores</span>
            <span className='font-medium tabular-nums'>
              {formatCurrency(
                reconciliation.totalCustomerCharges,
                settlement.currency,
              )}
            </span>
          </div>
          <div className='flex justify-between gap-4 border-b pb-2'>
            <span className='text-muted-foreground'>Crédito del procesador</span>
            <span className='font-medium tabular-nums'>
              {formatCurrency(
                reconciliation.totalProcessorCredits,
                settlement.currency,
              )}
            </span>
          </div>
          <div className='flex justify-between gap-4 border-b pb-2'>
            <span className='text-muted-foreground'>Comisiones del procesador</span>
            <span className='font-medium tabular-nums'>
              {formatCurrency(
                reconciliation.totalProcessorFees,
                settlement.currency,
              )}
            </span>
          </div>
          <div className='flex justify-between gap-4 border-b pb-2'>
            <span className='text-muted-foreground'>Ganancias vendedores</span>
            <span className='font-medium tabular-nums'>
              {formatCurrency(
                reconciliation.totalSellerEarnings,
                settlement.currency,
              )}
            </span>
          </div>
          <div className='flex justify-between gap-4 border-b pb-2'>
            <span className='text-muted-foreground'>Ingreso plataforma</span>
            <span className='font-medium tabular-nums'>
              {formatCurrency(
                reconciliation.platformRevenue,
                settlement.currency,
              )}
            </span>
          </div>
          <div className='flex justify-between gap-4'>
            <span className='text-muted-foreground'>
              Diferencia (declarado − créditos)
            </span>
            <span className='font-medium tabular-nums'>
              {formatCurrency(
                reconciliation.unreconciledDifference,
                settlement.currency,
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagos incluidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID pago</TableHead>
                  <TableHead>Operación</TableHead>
                  <TableHead>Comprador (cargo)</TableHead>
                  <TableHead>Crédito procesador</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Plataforma (est.)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='text-center'>
                      Sin ítems vinculados a pagos (liquidación manual o
                      histórica)
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map(row => (
                    <TableRow key={row.settlementItemId}>
                      <TableCell className='font-mono text-xs'>
                        {row.paymentId
                          ? `${row.paymentId.slice(0, 8)}…`
                          : '—'}
                      </TableCell>
                      <TableCell className='max-w-[140px] truncate font-mono text-xs'>
                        {row.providerPaymentId}
                      </TableCell>
                      <TableCell className='tabular-nums'>
                        {formatCurrency(row.customerAmount, row.currency)}
                      </TableCell>
                      <TableCell className='tabular-nums'>
                        {formatCurrency(row.processorCredit, row.currency)}
                      </TableCell>
                      <TableCell className='tabular-nums'>
                        {formatCurrency(row.processorFee, row.currency)}
                      </TableCell>
                      <TableCell className='tabular-nums'>
                        {formatCurrency(row.platformShare, row.currency)}
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
