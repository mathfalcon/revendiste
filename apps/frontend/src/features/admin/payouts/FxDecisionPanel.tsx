import {useMutation, useQueryClient} from '@tanstack/react-query';
import {Badge} from '~/components/ui/badge';
import {Button} from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {refreshPayoutRateLockMutation} from '~/lib/api/admin';
import type {GetPayoutDetailsResponse} from '~/lib/api/generated';
import {Loader2, RefreshCw} from 'lucide-react';
import {toast} from 'sonner';

type FxSupport = GetPayoutDetailsResponse['fxDecisionSupport'];

function formatDurationMs(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h <= 0) return `${m} min`;
  return `${h} h ${m} min`;
}

interface FxDecisionPanelProps {
  payoutId: string;
  payoutStatus: string;
  fx: FxSupport;
}

export function FxDecisionPanel({
  payoutId,
  payoutStatus,
  fx,
}: FxDecisionPanelProps) {
  const queryClient = useQueryClient();

  const refreshMutation = useMutation({
    ...refreshPayoutRateLockMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: ['admin', 'payouts']});
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'payouts', payoutId],
      });
      toast.success('Tipo de cambio actualizado');
    },
    onError: (error: {response?: {data?: {message?: string}}}) => {
      toast.error(
        error.response?.data?.message ||
          'No se pudo actualizar el tipo de cambio',
      );
    },
  });

  const showBrou = Number.isFinite(fx.currentBrouVentaRate);
  const showDlocal = fx.dLocalAverageExchangeRate != null;
  const rateLock = fx.rateLock;
  const showRateLock = rateLock != null;

  if (!showBrou && !showDlocal && !showRateLock) {
    return null;
  }

  const canRefresh =
    payoutStatus === 'pending' && showRateLock && !refreshMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Tipo de cambio (decisión)</CardTitle>
        <CardDescription>
          Comparación BROU eBROU vs bloqueo del retiro y referencia dLocal.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4 text-sm'>
        {showRateLock && rateLock && (
          <div className='rounded-lg border bg-muted/30 p-3 space-y-2'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <span className='font-medium'>Bloqueo actual</span>
              {fx.rateLockExpired ? (
                <Badge variant='destructive'>Vencido</Badge>
              ) : (
                <Badge
                  variant='outline'
                  className='border-green-600/50 bg-green-500/10 text-green-800 dark:text-green-300'
                >
                  Vigente
                  {fx.rateLockMsRemaining != null &&
                    ` · ${formatDurationMs(fx.rateLockMsRemaining)} restantes`}
                </Badge>
              )}
            </div>
            <div className='grid gap-1 sm:grid-cols-2'>
              <div className='text-muted-foreground'>BROU venta al bloqueo</div>
              <div className='tabular-nums sm:text-right'>
                1 USD = {rateLock.brouVentaRate.toFixed(4)} UYU
              </div>
              <div className='text-muted-foreground'>
                Tipo efectivo (+{rateLock.spreadPercent}% spread)
              </div>
              <div className='tabular-nums sm:text-right'>
                1 USD = {rateLock.lockedRate.toFixed(4)} UYU
              </div>
              <div className='text-muted-foreground'>UYU origen</div>
              <div className='tabular-nums sm:text-right'>
                {rateLock.originalAmount.toLocaleString('es-UY')} UYU
              </div>
              <div className='text-muted-foreground'>USD a pagar</div>
              <div className='tabular-nums sm:text-right font-medium'>
                USD {rateLock.convertedAmount.toFixed(2)}
              </div>
            </div>
            {fx.uyuCostAtLockedRate != null && (
              <p className='text-xs text-muted-foreground pt-1 border-t'>
                Costo UYU a tipo bloqueado (referencia):{' '}
                <span className='font-medium text-foreground'>
                  {fx.uyuCostAtLockedRate.toLocaleString('es-UY')} UYU
                </span>
              </p>
            )}
            {canRefresh && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='mt-2'
                onClick={() => refreshMutation.mutate(payoutId)}
              >
                {refreshMutation.isPending ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <RefreshCw className='h-4 w-4' />
                )}
                <span className='ml-2'>
                  Refrescar tipo (nuevo bloqueo 72 h)
                </span>
              </Button>
            )}
          </div>
        )}

        {showBrou && (
          <div className='flex justify-between gap-4 border-b pb-2'>
            <span className='text-muted-foreground'>BROU eBROU venta (ahora)</span>
            <span className='font-medium tabular-nums'>
              1 USD = {fx.currentBrouVentaRate.toFixed(4)} UYU
            </span>
          </div>
        )}

        {showDlocal && (
          <div className='flex justify-between gap-4 border-b pb-2'>
            <span className='text-muted-foreground'>
              TC promedio dLocal (liquidación)
            </span>
            <span className='font-medium tabular-nums'>
              1 USD = {fx.dLocalAverageExchangeRate!.toFixed(4)} UYU
            </span>
          </div>
        )}

        <p className='text-xs text-muted-foreground'>
          Spread configurado: {fx.spreadPercentConfigured}% · Bloqueo:{' '}
          {fx.rateLockHoursConfigured} h
        </p>

        {fx.fxProcessing && (
          <div className='rounded-md border border-dashed p-2 text-xs space-y-1'>
            <p className='font-medium'>Ejecución bancaria (admin)</p>
            {fx.fxProcessing.actualBankRate != null && (
              <p>
                TC banco real:{' '}
                <span className='tabular-nums'>
                  {fx.fxProcessing.actualBankRate}
                </span>
              </p>
            )}
            {fx.fxProcessing.actualUyuCost != null && (
              <p>
                UYU gastados:{' '}
                <span className='tabular-nums'>
                  {fx.fxProcessing.actualUyuCost.toLocaleString('es-UY')}
                </span>
              </p>
            )}
            {fx.fxProcessing.rateWasExpired === true && (
              <p className='text-amber-700 dark:text-amber-400'>
                Procesado con bloqueo vencido.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
