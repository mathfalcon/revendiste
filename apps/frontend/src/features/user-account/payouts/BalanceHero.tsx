import {useState} from 'react';
import {Card, CardContent} from '~/components/ui/card';
import {Button} from '~/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import {Popover, PopoverContent, PopoverTrigger} from '~/components/ui/popover';
import {ChevronDown, Wallet, ArrowUpRight, HelpCircle} from 'lucide-react';
import {formatCurrency} from '~/utils';
import type {EventTicketCurrency} from '@revendiste/shared';

interface BalanceByCurrency {
  currency: EventTicketCurrency;
  amount: string;
  count: number;
}

interface BalanceHeroProps {
  available: BalanceByCurrency[];
  retained: BalanceByCurrency[];
  pending: BalanceByCurrency[];
  payoutPending: BalanceByCurrency[];
  paidOut: BalanceByCurrency[];
  total: BalanceByCurrency[];
  onWithdraw: (currency: EventTicketCurrency) => void;
}

const STATUS_LABELS = [
  {
    key: 'retained',
    label: 'Retenido',
    color: 'text-yellow-600',
    tooltip:
      'Ganancias retenidas temporalmente por un caso abierto o documentos pendientes.',
  },
  {
    key: 'pending',
    label: 'Pendiente de liberación',
    color: 'text-blue-600',
    tooltip:
      'Tus ganancias estarán disponibles 48 horas después de finalizado el evento. Se liberan automáticamente.',
  },
  {
    key: 'payoutPending',
    label: 'En proceso de retiro',
    color: 'text-purple-600',
    tooltip: 'Ya solicitaste el retiro y estamos procesando la transferencia.',
  },
  {
    key: 'paidOut',
    label: 'Retirado',
    color: 'text-emerald-600',
    tooltip: 'Ganancias que ya fueron transferidas a tu cuenta.',
  },
] as const;

function getAmount(
  items: BalanceByCurrency[],
  currency: EventTicketCurrency,
): string {
  return items.find(b => b.currency === currency)?.amount || '0';
}

function getCount(
  items: BalanceByCurrency[],
  currency: EventTicketCurrency,
): number {
  return items.find(b => b.currency === currency)?.count || 0;
}

export function BalanceHero({
  available,
  retained,
  pending,
  payoutPending,
  paidOut,
  total,
  onWithdraw,
}: BalanceHeroProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const currencies = ['UYU', 'USD'] as const;

  const statusData = {
    retained,
    pending,
    payoutPending,
    paidOut,
  };

  return (
    <div className='space-y-3'>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
        {currencies.map(currency => {
          const availableAmount = getAmount(available, currency);
          const hasBalance = parseFloat(availableAmount) > 0;
          const totalAmount = getAmount(total, currency);
          const ticketCount = getCount(total, currency);

          return (
            <Card
              key={currency}
              className={`overflow-hidden ${hasBalance ? 'border-green-500/20 bg-green-500/5' : ''}`}
            >
              <CardContent className='p-0 h-full'>
                <div className='flex h-full'>
                  {/* Left accent bar */}
                  <div
                    className={`w-1.5 ${hasBalance ? 'bg-linear-to-b from-green-400 to-green-500' : 'bg-linear-to-b from-muted-foreground/40 to-muted-foreground/60'}`}
                  />
                  <div className='flex-1 p-4 flex flex-col justify-between gap-3'>
                    <div className='space-y-1'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Wallet className='h-4 w-4' />
                        <span className='text-sm font-medium'>
                          Disponible en {currency}
                        </span>
                      </div>
                      <span className='text-3xl font-bold tracking-tight block'>
                        {formatCurrency(availableAmount, currency)}
                      </span>
                      {ticketCount > 0 && (
                        <p className='text-xs text-muted-foreground'>
                          {ticketCount} entrada
                          {ticketCount !== 1 ? 's' : ''} en total ·{' '}
                          {formatCurrency(totalAmount, currency)} acumulado
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => onWithdraw(currency)}
                      disabled={!hasBalance}
                      className='w-full'
                      size='sm'
                    >
                      <ArrowUpRight className='h-4 w-4 mr-1.5' />
                      Retirar {currency}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
        <CollapsibleTrigger asChild>
          <button className='flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-1'>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
            />
            Ver detalle de balance
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className='mt-2'>
            <CardContent className='p-4'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1'>
                {currencies.map(currency => (
                  <div key={currency} className='space-y-1.5'>
                    <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2'>
                      {currency}
                    </p>
                    {STATUS_LABELS.map(({key, label, color, tooltip}) => (
                      <div
                        key={key}
                        className='flex justify-between items-center text-sm'
                      >
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className='text-muted-foreground inline-flex items-center gap-1 cursor-help'>
                              {label}
                              <HelpCircle className='h-3 w-3' />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            side='top'
                            className='max-w-60 text-sm p-3'
                          >
                            {tooltip}
                          </PopoverContent>
                        </Popover>
                        <span className={`font-medium ${color}`}>
                          {formatCurrency(
                            getAmount(statusData[key], currency),
                            currency,
                          )}
                        </span>
                      </div>
                    ))}
                    <div className='flex justify-between items-center text-sm border-t pt-1.5 mt-1.5'>
                      <span className='font-medium'>Total</span>
                      <span className='font-semibold'>
                        {formatCurrency(getAmount(total, currency), currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
