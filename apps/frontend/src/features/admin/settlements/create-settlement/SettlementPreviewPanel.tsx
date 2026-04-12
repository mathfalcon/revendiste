import {Scale} from 'lucide-react';
import {Alert, AlertDescription, AlertTitle} from '~/components/ui/alert';
import {Skeleton} from '~/components/ui/skeleton';
import {cn} from '~/lib/utils';
import type {PreviewSettlementResponse} from '~/lib/api/generated';
import {formatAmount} from '~/utils';

export interface SettlementPreviewPanelProps {
  result: PreviewSettlementResponse | null;
  isLoading: boolean;
}

export function SettlementPreviewPanel({
  result,
  isLoading,
}: SettlementPreviewPanelProps) {
  if (isLoading) {
    return (
      <div className='space-y-3' aria-busy='true' aria-label='Cargando vista previa'>
        <Skeleton className='h-4 w-3/4' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-5/6' />
        <Skeleton className='h-4 w-2/3' />
      </div>
    );
  }

  if (!result) {
    return (
      <p className='text-sm text-muted-foreground'>
        Al confirmar, primero pedimos la conciliación estimada al servidor; solo
        si no hay bloqueos se guarda la liquidación. No hay creación directa sin
        ese paso.
      </p>
    );
  }

  const blocking = result.hasBlockingError || result.duplicateExists;

  return (
    <Alert
      variant={blocking ? 'destructive' : 'default'}
      className={cn(
        !blocking &&
          result.hasWarning &&
          'border-amber-500/50 bg-amber-500/10',
        !blocking &&
          !result.hasWarning &&
          'border-green-600/40 bg-green-500/10',
      )}
    >
      <Scale className='h-4 w-4' />
      <AlertTitle>Conciliación estimada</AlertTitle>
      <AlertDescription className='space-y-1 text-left'>
        <p>
          Pagos incluidos: <strong>{result.paymentCount}</strong>
        </p>
        <p>
          Suma de créditos del procesador:{' '}
          <strong>
            {formatAmount(result.computedTotal)} {result.currency}
          </strong>
        </p>
        <p>
          Monto declarado:{' '}
          <strong>
            {formatAmount(result.declaredTotal)} {result.currency}
          </strong>
        </p>
        <p>
          Diferencia: <strong>{result.differencePercent}%</strong>
        </p>
        {result.duplicateExists && (
          <p>Ya existe una liquidación con este ID externo.</p>
        )}
        {result.messageKey === 'NO_PAYMENTS' && (
          <p>No hay pagos sin conciliar para esta moneda y fecha.</p>
        )}
        {result.messageKey === 'INVALID_AMOUNT' && (
          <p>Revisá el monto ingresado.</p>
        )}
        {result.messageKey === 'MISMATCH' && !result.duplicateExists && (
          <p>
            La diferencia supera el 10%: no se puede crear hasta corregir el
            monto o revisar los pagos.
          </p>
        )}
        {result.messageKey === 'WARNING' && (
          <p>
            Diferencia entre 1% y 10%: podés crear igual; quedará registrada
            como advertencia.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
