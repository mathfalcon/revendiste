import {Link} from '@tanstack/react-router';
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
import {CopyButton} from '~/components/ui/copy-button';
import {Alert, AlertDescription, AlertTitle} from '~/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {refreshPayoutRateLockMutation} from '~/lib/api/admin';
import {formatCurrency} from '~/utils';
import {formatProvidersList} from '@revendiste/shared';
import {ArrowRight, ArrowRightLeft, ExternalLink, Info, Loader2, RefreshCw} from 'lucide-react';
import {toast} from 'sonner';
import type {GetPayoutDetailsResponse} from '~/lib/api/generated';

type FxSupport = GetPayoutDetailsResponse['fxDecisionSupport'];

function formatDurationMs(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h <= 0) return `${m} min`;
  return `${h} h ${m} min`;
}

interface StepFxReviewProps {
  payoutId: string;
  payout: GetPayoutDetailsResponse;
  onNext: () => void;
}

function RateLockSection({
  payoutId,
  payoutStatus,
  fx,
}: {
  payoutId: string;
  payoutStatus: string;
  fx: FxSupport;
}) {
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

  const rateLock = fx.rateLock;
  const canRefresh =
    payoutStatus === 'pending' && rateLock != null && !refreshMutation.isPending;

  if (!rateLock) return null;

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <CardTitle className='text-base'>Bloqueo de tipo de cambio</CardTitle>
          {fx.rateLockExpired ? (
            <Badge variant='destructive'>Vencido</Badge>
          ) : (
            <Badge
              variant='outline'
              className='border-green-600/50 bg-green-500/10 text-green-700 dark:text-green-400'
            >
              Vigente
              {fx.rateLockMsRemaining != null &&
                ` · ${formatDurationMs(fx.rateLockMsRemaining)} restantes`}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='grid gap-2 text-sm sm:grid-cols-2'>
          <div className='text-muted-foreground'>BROU venta al bloqueo</div>
          <div className='tabular-nums font-medium sm:text-right'>
            1 USD = {rateLock.brouVentaRate.toFixed(4)} UYU
          </div>
          <div className='text-muted-foreground'>
            Tipo efectivo (+{rateLock.spreadPercent}% spread)
          </div>
          <div className='tabular-nums font-medium sm:text-right'>
            1 USD = {rateLock.lockedRate.toFixed(4)} UYU
          </div>
          <div className='text-muted-foreground'>UYU origen</div>
          <div className='tabular-nums sm:text-right'>
            {rateLock.originalAmount.toLocaleString('es-UY')} UYU
          </div>
          <div className='text-muted-foreground'>USD a pagar</div>
          <div className='tabular-nums font-semibold sm:text-right'>
            USD {rateLock.convertedAmount.toFixed(2)}
          </div>
        </div>

        {fx.uyuCostAtLockedRate != null && (
          <p className='text-xs text-muted-foreground border-t pt-2'>
            Costo UYU a tipo bloqueado (ref):{' '}
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
            className='cursor-pointer'
            onClick={() => refreshMutation.mutate(payoutId)}
          >
            {refreshMutation.isPending ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <RefreshCw className='h-4 w-4' />
            )}
            <span className='ml-2'>Refrescar tipo (nuevo bloqueo 72 h)</span>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function CurrentRatesSection({fx}: {fx: FxSupport}) {
  const showBrou = Number.isFinite(fx.currentBrouVentaRate);
  const showDlocal = fx.dLocalAverageExchangeRate != null;

  if (!showBrou && !showDlocal) return null;

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base'>Tasas de referencia</CardTitle>
      </CardHeader>
      <CardContent className='space-y-2 text-sm'>
        {showBrou && (
          <div className='flex justify-between gap-4'>
            <span className='text-muted-foreground'>BROU eBROU venta (ahora)</span>
            <span className='tabular-nums font-medium'>
              1 USD = {fx.currentBrouVentaRate.toFixed(4)} UYU
            </span>
          </div>
        )}
        {showDlocal && (
          <div className='flex justify-between gap-4'>
            <span className='text-muted-foreground'>
              TC promedio dLocal (liquidación)
            </span>
            <span className='tabular-nums font-medium'>
              1 USD = {fx.dLocalAverageExchangeRate!.toFixed(4)} UYU
            </span>
          </div>
        )}
        <p className='text-xs text-muted-foreground pt-1'>
          Spread configurado: {fx.spreadPercentConfigured}% · Bloqueo:{' '}
          {fx.rateLockHoursConfigured} h
        </p>
      </CardContent>
    </Card>
  );
}

export function StepFxReview({payoutId, payout, onNext}: StepFxReviewProps) {
  const fx = payout.fxDecisionSupport;
  const hasFxData =
    Number.isFinite(fx.currentBrouVentaRate) ||
    fx.dLocalAverageExchangeRate != null ||
    fx.rateLock != null;

  return (
    <div className='space-y-4'>
      {payout.currency === 'UYU' && (
        <Alert>
          <Info className='h-4 w-4' />
          <AlertTitle>Retiro en UYU</AlertTitle>
          <AlertDescription className='text-sm'>
            Coincide con la moneda de liquidación; no hay conversión adicional.
            Podés avanzar directamente.
          </AlertDescription>
        </Alert>
      )}

      {hasFxData && payout.currency !== 'UYU' && (
        <>
          <RateLockSection
            payoutId={payoutId}
            payoutStatus={payout.status}
            fx={fx}
          />
          <CurrentRatesSection fx={fx} />
        </>
      )}

      {payout.settlementInfo?.hasExchangeRateData &&
        payout.currency === 'USD' && (
          <Alert className='border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'>
            <ArrowRightLeft className='h-4 w-4' />
            <AlertTitle>Liquidación dLocal</AlertTitle>
            <AlertDescription className='space-y-2 text-sm'>
              <p>
                Retiro en USD con acreditación en UYU por el procesador
                {payout.settlementInfo.providers?.length
                  ? ` (${formatProvidersList(payout.settlementInfo.providers)})`
                  : ''}
                .
              </p>
              {payout.settlementInfo.settlements.map((s, i) => (
                <div
                  key={i}
                  className='rounded border bg-background/80 p-2 text-xs'
                >
                  {s.averageExchangeRate != null && (
                    <p>
                      TC promedio: 1 USD ={' '}
                      {s.averageExchangeRate.toFixed(4)} UYU
                    </p>
                  )}
                </div>
              ))}
            </AlertDescription>
          </Alert>
        )}

      {/* Earnings summary */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Ganancias incluidas</CardTitle>
          <CardDescription>
            {payout.linkedEarnings.length} ítem
            {payout.linkedEarnings.length !== 1 ? 'es' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Monto</TableHead>
                <TableHead>Moneda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payout.linkedEarnings.map(e => (
                <TableRow key={e.id}>
                  <TableCell className='tabular-nums'>
                    {formatCurrency(e.sellerAmount, e.currency)}
                  </TableCell>
                  <TableCell>{e.currency}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Linked settlements */}
      {payout.settlementInfo?.linkedProcessorSettlements &&
        payout.settlementInfo.linkedProcessorSettlements.length > 0 && (
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>Origen de fondos</CardTitle>
              <CardDescription>
                Liquidaciones del procesador vinculadas.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-2'>
              {payout.settlementInfo.linkedProcessorSettlements.map(s => (
                <div
                  key={s.id}
                  className='flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 p-3 text-sm'
                >
                  <div className='min-w-0'>
                    <p className='font-mono text-xs text-muted-foreground truncate'>
                      {s.externalSettlementId}
                    </p>
                    <p>
                      {formatCurrency(s.totalAmount, s.settlementCurrency)} ·{' '}
                      {s.paymentProvider}
                    </p>
                  </div>
                  <Button variant='outline' size='sm' className='cursor-pointer' asChild>
                    <Link
                      to='/admin/finanzas/liquidaciones/$settlementId'
                      params={{settlementId: s.id}}
                    >
                      Ver liquidación
                    </Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

      {/* Seller info */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Vendedor</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          {payout.seller ? (
            <>
              <p className='font-medium'>
                {payout.seller.firstName} {payout.seller.lastName}
              </p>
              <p className='text-muted-foreground'>{payout.seller.email}</p>
            </>
          ) : (
            <p className='text-muted-foreground'>
              Información del vendedor no disponible.
            </p>
          )}
          <div className='flex flex-wrap items-center gap-3 pt-1'>
            <Button variant='outline' size='sm' className='cursor-pointer' asChild>
              <Link to='/admin/verificaciones'>
                <ExternalLink className='mr-1.5 h-3.5 w-3.5' />
                Verificación de identidad
              </Link>
            </Button>
            <div className='flex items-center gap-1 text-xs text-muted-foreground'>
              <span className='font-mono break-all'>
                {payout.sellerUserId}
              </span>
              <CopyButton text={payout.sellerUserId} size='sm' />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='flex justify-end pt-2'>
        <Button
          type='button'
          className='cursor-pointer min-w-[160px]'
          onClick={onNext}
        >
          Siguiente
          <ArrowRight className='ml-2 h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
