import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {Badge} from '~/components/ui/badge';
import {formatCurrency} from '~/utils';
import type {EventTicketCurrency} from '@revendiste/shared';

interface BalanceByCurrency {
  currency: EventTicketCurrency;
  amount: string;
  count: number;
}

interface BalanceSectionProps {
  available: BalanceByCurrency[];
  retained: BalanceByCurrency[];
  pending: BalanceByCurrency[];
  total: BalanceByCurrency[];
}

export function BalanceSection({
  available,
  retained,
  pending,
  total,
}: BalanceSectionProps) {
  const currencies = ['UYU', 'USD'] as const;

  return (
    <div className='space-y-4'>
      <div>
        <h3 className='text-lg font-semibold mb-2'>Balance</h3>
        <p className='text-sm text-muted-foreground'>
          Resumen de tus ganancias por estados
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {currencies.map(currency => {
          const availableBalance = available.find(
            b => b.currency === currency,
          ) || {
            currency,
            amount: '0',
            count: 0,
          };
          const retainedBalance = retained.find(
            b => b.currency === currency,
          ) || {
            currency,
            amount: '0',
            count: 0,
          };
          const pendingBalance = pending.find(b => b.currency === currency) || {
            currency,
            amount: '0',
            count: 0,
          };
          const totalBalance = total.find(b => b.currency === currency) || {
            currency,
            amount: '0',
            count: 0,
          };

          return (
            <Card key={currency}>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  <span>Balance {currency}</span>
                  <Badge variant='outline'>{currency}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-muted-foreground'>
                    Disponible:
                  </span>
                  <span className='font-semibold text-green-600'>
                    {formatCurrency(availableBalance.amount, currency)}
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-muted-foreground'>
                    Retenido:
                  </span>
                  <span className='font-semibold text-yellow-600'>
                    {formatCurrency(retainedBalance.amount, currency)}
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-muted-foreground'>
                    Pendiente:
                  </span>
                  <span className='font-semibold text-blue-600'>
                    {formatCurrency(pendingBalance.amount, currency)}
                  </span>
                </div>
                <div className='border-t pt-3 flex justify-between items-center'>
                  <span className='text-sm font-semibold'>Total:</span>
                  <span className='text-lg font-bold'>
                    {formatCurrency(totalBalance.amount, currency)}
                  </span>
                </div>
                <div className='text-xs text-muted-foreground'>
                  {totalBalance.count} ticket
                  {totalBalance.count !== 1 ? 's' : ''}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
