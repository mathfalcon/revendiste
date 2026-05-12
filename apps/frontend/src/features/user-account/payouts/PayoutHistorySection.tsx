import {useInfiniteQuery} from '@tanstack/react-query';
import {useNavigate} from '@tanstack/react-router';
import {getPayoutHistoryInfiniteQuery} from '~/lib/api/payouts';
import {Badge} from '~/components/ui/badge';
import {Button} from '~/components/ui/button';
import {Skeleton} from '~/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {formatCurrency, formatDate} from '~/utils';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Ban,
  ChevronRight,
} from 'lucide-react';
import {AccountEmptyState} from '../AccountEmptyState';

function HistorySkeleton() {
  return (
    <div className='space-y-3'>
      {[1, 2, 3].map(i => (
        <div key={i} className='flex items-center gap-4 p-3'>
          <Skeleton className='h-5 w-20' />
          <Skeleton className='h-5 w-24 flex-1' />
          <Skeleton className='h-5 w-20' />
          <Skeleton className='h-5 w-8' />
        </div>
      ))}
    </div>
  );
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    icon: Clock,
    className:
      'border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  },
  processing: {
    label: 'Procesando',
    icon: AlertCircle,
    className:
      'border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  },
  completed: {
    label: 'Completado',
    icon: CheckCircle,
    className:
      'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400',
  },
  failed: {
    label: 'Fallido',
    icon: XCircle,
    className: 'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400',
  },
  cancelled: {
    label: 'Cancelado',
    icon: Ban,
    className:
      'border-gray-500/50 bg-gray-500/10 text-gray-700 dark:text-gray-400',
  },
} as const;

function StatusBadge({status}: {status: string}) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  if (!config) return <Badge variant='outline'>{status}</Badge>;
  const Icon = config.icon;
  return (
    <Badge variant='outline' className={config.className}>
      <Icon className='h-3 w-3 mr-1' aria-hidden />
      {config.label}
    </Badge>
  );
}

export function PayoutHistorySection() {
  const {
    data,
    isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(getPayoutHistoryInfiniteQuery());
  const navigate = useNavigate({from: '/cuenta/retiro/'});

  const goToDetail = (payoutId: string) => {
    navigate({
      to: '/cuenta/retiro/$payoutId',
      params: {payoutId},
    });
  };

  const rows = data?.pages.flatMap(p => p.data) ?? [];

  if (isPending) {
    return <HistorySkeleton />;
  }

  if (rows.length === 0) {
    return (
      <AccountEmptyState
        icon={<Clock className='h-8 w-8 text-muted-foreground' aria-hidden />}
        title='Sin retiros todavía'
        description='Cuando solicites un retiro, vas a ver el estado y el detalle acá.'
      />
    );
  }

  return (
    <>
      <p className='text-sm text-muted-foreground mb-3 md:mb-4'>
        Tocá una fila o tarjeta para ver fechas, comprobantes y el historial del
        retiro.
      </p>

      <div className='hidden md:block rounded-lg border overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead>Estado</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className='w-12' aria-hidden />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(payout => {
              const amountLabel = formatCurrency(
                payout.amount,
                payout.currency,
              );
              return (
                <TableRow
                  key={payout.id}
                  tabIndex={0}
                  role='link'
                  aria-label={`Ver detalle del retiro de ${amountLabel}, ${STATUS_CONFIG[payout.status as keyof typeof STATUS_CONFIG]?.label ?? payout.status}`}
                  className='cursor-pointer transition-colors duration-200 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
                  onClick={() => goToDetail(payout.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      goToDetail(payout.id);
                    }
                  }}
                >
                  <TableCell>
                    <StatusBadge status={payout.status} />
                  </TableCell>
                  <TableCell className='font-medium tabular-nums'>
                    {amountLabel}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {formatDate(payout.requestedAt)}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    <ChevronRight className='h-4 w-4 shrink-0' aria-hidden />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className='md:hidden space-y-2'>
        {rows.map(payout => (
          <button
            key={payout.id}
            type='button'
            onClick={() => goToDetail(payout.id)}
            className='w-full flex items-center gap-3 p-4 min-h-12 rounded-lg border text-left cursor-pointer transition-colors duration-200 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
          >
            <div className='flex-1 min-w-0 space-y-1'>
              <div className='flex items-center justify-between gap-2'>
                <span className='font-medium tabular-nums'>
                  {formatCurrency(payout.amount, payout.currency)}
                </span>
                <StatusBadge status={payout.status} />
              </div>
              <p className='text-xs text-muted-foreground'>
                {formatDate(payout.requestedAt)}
              </p>
            </div>
            <ChevronRight
              className='h-5 w-5 text-muted-foreground shrink-0'
              aria-hidden
            />
          </button>
        ))}
      </div>

      {hasNextPage && (
        <div className='flex justify-center pt-4'>
          <Button
            type='button'
            variant='outline'
            className='cursor-pointer min-h-11'
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
          </Button>
        </div>
      )}
    </>
  );
}
