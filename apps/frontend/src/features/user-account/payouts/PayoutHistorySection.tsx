import {useQuery} from '@tanstack/react-query';
import {useNavigate} from '@tanstack/react-router';
import {getPayoutHistoryQuery} from '~/lib/api/payouts';
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
import {CheckCircle, Clock, XCircle, AlertCircle, Eye, Ban} from 'lucide-react';

function HistorySkeleton() {
  return (
    <div className='space-y-3'>
      {[1, 2, 3].map(i => (
        <div key={i} className='flex items-center gap-4 p-3'>
          <Skeleton className='h-5 w-20' />
          <Skeleton className='h-5 w-24 flex-1' />
          <Skeleton className='h-5 w-20' />
          <Skeleton className='h-8 w-8' />
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
      <Icon className='h-3 w-3 mr-1' />
      {config.label}
    </Badge>
  );
}

export function PayoutHistorySection() {
  const {data: history, isPending} = useQuery(getPayoutHistoryQuery(1, 20));
  const navigate = useNavigate({from: '/cuenta/retiro'});

  const handleViewDetails = (payoutId: string) => {
    navigate({
      search: prev => ({...prev, payoutId}),
      resetScroll: false,
    });
  };

  if (isPending) {
    return <HistorySkeleton />;
  }

  if (!history || history.data.length === 0) {
    return (
      <div className='rounded-lg border border-dashed p-8 text-center'>
        <p className='text-muted-foreground'>
          Todavía no solicitaste ningún retiro
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className='hidden md:block rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className='w-[50px]' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.data.map(payout => (
              <TableRow key={payout.id}>
                <TableCell>
                  <StatusBadge status={payout.status} />
                </TableCell>
                <TableCell className='font-medium'>
                  {formatCurrency(payout.amount, payout.currency)}
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {formatDate(payout.requestedAt)}
                </TableCell>
                <TableCell>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => handleViewDetails(payout.id)}
                    className='h-8 w-8'
                  >
                    <Eye className='h-4 w-4' />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile stacked list */}
      <div className='md:hidden space-y-2'>
        {history.data.map(payout => (
          <button
            key={payout.id}
            onClick={() => handleViewDetails(payout.id)}
            className='w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left'
          >
            <div className='flex-1 min-w-0 space-y-1'>
              <div className='flex items-center justify-between gap-2'>
                <span className='font-medium'>
                  {formatCurrency(payout.amount, payout.currency)}
                </span>
                <StatusBadge status={payout.status} />
              </div>
              <p className='text-xs text-muted-foreground'>
                {formatDate(payout.requestedAt)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
