import {Badge} from '~/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import type {GetPayoutDetailsResponse} from '~/lib/api/generated';

type FxSupport = GetPayoutDetailsResponse['fxDecisionSupport'];

function formatDurationMs(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h <= 0) return `${m} min`;
  return `${h} h ${m} min`;
}

interface FxDecisionPanelProps {
  fx: FxSupport;
}

export function FxDecisionPanel({fx}: FxDecisionPanelProps) {
  const showBrou = Number.isFinite(fx.currentBrouVentaRate);
  const showDlocal = fx.dLocalAverageExchangeRate != null;
  const snap = fx.fxSnapshot;
  const showSnapshot = snap != null;

  if (!showBrou && !showDlocal && !showSnapshot && !fx.fxExecution) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Tipo de cambio (decisión)</CardTitle>
        <CardDescription>
          Cotización al momento del retiro, tasas actuales y ejecución (si
          aplica).
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4 text-sm'>
        {showSnapshot && snap && (
          <div className='rounded-lg border bg-muted/30 p-3 space-y-2'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <span className='font-medium'>Cotización del retiro</span>
              {snap.quoteExpiresAt != null ? (
                fx.quoteExpired ? (
                  <Badge variant='destructive'>Cotización vencida</Badge>
                ) : (
                  <Badge
                    variant='outline'
                    className='border-green-600/50 bg-green-500/10 text-green-800 dark:text-green-300'
                  >
                    Vigente
                    {fx.quoteMsRemaining != null &&
                      ` · ${formatDurationMs(fx.quoteMsRemaining)} restantes`}
                  </Badge>
                )
              ) : (
                <Badge variant='secondary'>Sin vencimiento declarado</Badge>
              )}
            </div>
            <div className='grid gap-1 sm:grid-cols-2'>
              <div className='text-muted-foreground'>Origen → destino</div>
              <div className='tabular-nums sm:text-right font-medium'>
                {snap.sourceAmount.toLocaleString('es-UY', {
                  maximumFractionDigits: 2,
                })}{' '}
                {snap.sourceCurrency} →{' '}
                {snap.destinationAmount.toLocaleString('es-UY', {
                  maximumFractionDigits: 2,
                })}{' '}
                {snap.destinationCurrency}
              </div>
              {snap.referenceRate != null && (
                <>
                  <div className='text-muted-foreground'>Referencia</div>
                  <div className='tabular-nums sm:text-right'>
                    {snap.referenceRate.source === 'brou_venta'
                      ? 'BROU venta'
                      : snap.referenceRate.source === 'dlocal_quote_reference'
                        ? 'dLocal (cotización)'
                        : 'Manual'}{' '}
                    · {snap.referenceRate.value.toFixed(4)} (
                    {new Date(snap.referenceRate.fetchedAt).toLocaleString(
                      'es-UY',
                    )}
                    )
                  </div>
                </>
              )}
              {snap.providerRate != null && (
                <>
                  <div className='text-muted-foreground'>Tipo efectivo</div>
                  <div className='tabular-nums sm:text-right'>
                    {snap.providerRate.toFixed(4)}
                    {snap.spreadPercent != null &&
                      ` (+${snap.spreadPercent}% spread)`}
                  </div>
                </>
              )}
              {snap.quoteId != null && (
                <>
                  <div className='text-muted-foreground'>Quote ID</div>
                  <div className='font-mono text-xs sm:text-right break-all'>
                    {snap.quoteId}
                  </div>
                </>
              )}
            </div>
            {fx.uyuCostAtSnapshotRate != null && (
              <p className='text-xs text-muted-foreground pt-1 border-t'>
                Costo UYU (referencia al snapshot):{' '}
                <span className='font-medium text-foreground'>
                  {fx.uyuCostAtSnapshotRate.toLocaleString('es-UY')} UYU
                </span>
              </p>
            )}
          </div>
        )}

        {showBrou && (
          <div className='flex justify-between gap-4 border-b pb-2'>
            <span className='text-muted-foreground'>
              BROU eBROU venta (ahora)
            </span>
            <span className='font-medium tabular-nums'>
              1 USD ={' '}
              {fx.currentBrouVentaRate == null
                ? '—'
                : `${fx.currentBrouVentaRate.toFixed(4)}`}{' '}
              UYU
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
          Spread configurado (manual UY→USD): {fx.spreadPercentConfigured}%
        </p>

        {fx.fxExecution && (
          <div className='rounded-md border border-dashed p-2 text-xs space-y-1'>
            <p className='font-medium'>Ejecución (admin / proveedor)</p>
            {fx.fxExecution.actualRate != null && (
              <p>
                TC efectivo:{' '}
                <span className='tabular-nums'>
                  {fx.fxExecution.actualRate}
                </span>
              </p>
            )}
            {fx.fxExecution.actualSourceAmount != null && (
              <p>
                Monto origen (UYU u otra moneda fuente):{' '}
                <span className='tabular-nums'>
                  {fx.fxExecution.actualSourceAmount.toLocaleString('es-UY')}
                </span>
              </p>
            )}
            {fx.fxExecution.providerFees != null && (
              <p>
                Comisiones proveedor:{' '}
                <span className='tabular-nums'>
                  {fx.fxExecution.providerFees}
                </span>
              </p>
            )}
            {fx.fxExecution.externalId != null && (
              <p className='font-mono break-all'>
                ID externo: {fx.fxExecution.externalId}
              </p>
            )}
            {fx.fxExecution.rateWasExpired === true && (
              <p className='text-amber-700 dark:text-amber-400'>
                Procesado con cotización vencida.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
