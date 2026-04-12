import {useState} from 'react';
import {ChevronDown, ChevronUp, PieChart} from 'lucide-react';
import type {GetDashboardRevenueByOrderCurrencyResponse} from '~/lib/api/generated';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {Skeleton} from '~/components/ui/skeleton';
import {Button} from '~/components/ui/button';
import {formatCurrency} from '~/utils';
import {CurrencyBreakdownDonut} from './charts/CurrencyBreakdownDonut';

type Props = {
  data: GetDashboardRevenueByOrderCurrencyResponse | undefined;
  isLoading: boolean;
};

export function CurrencyBreakdownSection({data, isLoading}: Props) {
  const [open, setOpen] = useState(false);

  const rows = data?.rows ?? [];
  const isSingleCurrency = rows.length === 1;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center gap-2'>
              <PieChart className='h-4 w-4 text-muted-foreground' aria-hidden />
              <CardTitle className='text-base'>
                Desglose por moneda de cobro
              </CardTitle>
            </div>
            <CollapsibleTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 w-7 cursor-pointer p-0'
                aria-label={open ? 'Colapsar desglose' : 'Expandir desglose'}
              >
                {open ? (
                  <ChevronUp className='h-4 w-4' />
                ) : (
                  <ChevronDown className='h-4 w-4' />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          <p className='text-sm text-muted-foreground'>
            Distribución de órdenes confirmadas por moneda de cobro; GMV y
            comisión en moneda original del pedido (sin conversión).
          </p>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className='pt-0'>
            {isLoading ? (
              <div className='space-y-2'>
                <Skeleton className='h-40 w-full' />
                <Skeleton className='h-20 w-full' />
              </div>
            ) : rows.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                Sin órdenes confirmadas con pago en el periodo seleccionado.
              </p>
            ) : isSingleCurrency ? (
              <p className='text-sm text-muted-foreground'>
                Todas las ventas del periodo están en{' '}
                <span className='font-semibold text-foreground'>
                  {rows[0]!.currency}
                </span>
                .
              </p>
            ) : (
              <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                <CurrencyBreakdownDonut rows={rows} />
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Moneda</TableHead>
                        <TableHead className='text-right'>GMV</TableHead>
                        <TableHead className='text-right'>
                          Comisión + IVA
                        </TableHead>
                        <TableHead className='text-right'>Órdenes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map(row => (
                        <TableRow key={row.currency}>
                          <TableCell className='font-semibold'>
                            {row.currency}
                          </TableCell>
                          <TableCell className='text-right tabular-nums'>
                            {formatCurrency(row.gmv, row.currency)}
                          </TableCell>
                          <TableCell className='text-right tabular-nums'>
                            {formatCurrency(
                              String(
                                parseFloat(row.platformCommission) +
                                  parseFloat(row.vatOnCommission),
                              ),
                              row.currency,
                            )}
                          </TableCell>
                          <TableCell className='text-right tabular-nums'>
                            {row.orderCount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
