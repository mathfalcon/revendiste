import type {UseQueryResult} from '@tanstack/react-query';
import {Alert, AlertDescription} from '~/components/ui/alert';
import {Skeleton} from '~/components/ui/skeleton';
import {Info} from 'lucide-react';
import {formatCurrency} from '~/utils';
import type {GetPayPalUyuFxPreviewResponse} from '~/lib/api/generated';

interface PayPalUyuFxAlertProps {
  fxPreviewQuery: UseQueryResult<GetPayPalUyuFxPreviewResponse, Error>;
  estimatedUsdPayPal: number | null;
}

export function PayPalUyuFxAlert({
  fxPreviewQuery,
  estimatedUsdPayPal,
}: PayPalUyuFxAlertProps) {
  return (
    <Alert variant={fxPreviewQuery.isError ? 'destructive' : 'default'}>
      <Info className='h-4 w-4' />
      <AlertDescription className='space-y-3'>
        <p className='font-medium text-foreground'>
          PayPal recibe en USD. Mostramos el tipo que usaríamos si confirmás
          ahora.
        </p>
        {fxPreviewQuery.isPending && (
          <div className='space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-5/6' />
          </div>
        )}
        {fxPreviewQuery.isError && (
          <p>
            No pudimos obtener la cotización. Probá de nuevo en unos minutos o
            elegí otro método de retiro.
          </p>
        )}
        {fxPreviewQuery.data && (
          <>
            <ul className='text-sm space-y-2 list-disc pl-4'>
              <li>
                <span className='text-muted-foreground'>
                  Cotización venta de referencia (eBROU Banco República)
                </span>
                :{' '}
                <span className='font-medium tabular-nums'>
                  1 USD ={' '}
                  {fxPreviewQuery.data.referenceVentaUyuPerUsd.toLocaleString(
                    'es-UY',
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    },
                  )}{' '}
                  UYU
                </span>
              </li>
              <li>
                <span className='text-muted-foreground'>Spread de Revendiste</span>
                :{' '}
                <span className='font-medium'>
                  {fxPreviewQuery.data.spreadPercent.toLocaleString('es-UY', {
                    maximumFractionDigits: 2,
                  })}
                  % sobre esa referencia (cubre variaciones del mercado).
                </span>
              </li>
              <li>
                <span className='text-muted-foreground'>
                  Tipo aplicado a tu retiro
                </span>
                :{' '}
                <span className='font-semibold tabular-nums'>
                  1 USD ={' '}
                  {fxPreviewQuery.data.effectiveUyuPerUsd.toLocaleString('es-UY', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}{' '}
                  UYU
                </span>
              </li>
            </ul>
            {estimatedUsdPayPal != null && (
              <p className='text-sm'>
                Con tu selección actual:{' '}
                <strong className='tabular-nums'>
                  ~ {formatCurrency(String(estimatedUsdPayPal), 'USD')}
                </strong>{' '}
                en PayPal (estimación).
              </p>
            )}
            <p className='text-xs text-muted-foreground leading-relaxed border-t pt-2'>
              El tipo y el monto en USD quedan fijados al tocar Confirmar. Si
              confirmás más tarde, pueden cambiar. Después de confirmar, el tipo
              queda reservado {Math.round(fxPreviewQuery.data.rateLockHours)}{' '}
              horas; si el equipo tarda más en procesar el retiro, podría
              actualizarse el tipo y te avisamos.
            </p>
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}
