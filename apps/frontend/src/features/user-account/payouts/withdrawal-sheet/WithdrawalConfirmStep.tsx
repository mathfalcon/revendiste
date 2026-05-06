import {Button} from '~/components/ui/button';
import {ArrowLeft, Check, Loader2, Plus} from 'lucide-react';
import {cn} from '~/lib/utils';
import {formatCurrency} from '~/utils';
import type {GetPayoutMethodsResponse} from '~/lib/api/generated';
import type {EventTicketCurrency} from '@revendiste/shared';
import {getPayoutMethodDropdownText} from '../payout-method-utils';

interface WithdrawalConfirmStepProps {
  currency: EventTicketCurrency;
  selectedTotal: number;
  selectedCount: number;
  compatibleMethods: GetPayoutMethodsResponse;
  payoutMethodId: string;
  onPayoutMethodId: (id: string) => void;
  onAddMethod: () => void;
  onSubmit: () => void;
  onBack: () => void;
  requestPayoutPending: boolean;
}

export function WithdrawalConfirmStep({
  currency,
  selectedTotal,
  selectedCount,
  compatibleMethods,
  payoutMethodId,
  onPayoutMethodId,
  onAddMethod,
  onSubmit,
  onBack,
  requestPayoutPending,
}: WithdrawalConfirmStepProps) {
  return (
    <>
      <div className='flex-1 overflow-y-auto px-6 py-4 space-y-5'>
        <div className='rounded-lg border bg-card p-4 space-y-3'>
          <p className='text-sm font-medium'>Resumen del retiro</p>
          <div className='space-y-2'>
            <div className='flex justify-between items-center text-sm'>
              <span className='text-muted-foreground'>Monto a retirar</span>
              <span className='text-lg font-bold'>
                {formatCurrency(String(selectedTotal), currency)}
              </span>
            </div>
            <div className='flex justify-between items-center text-sm border-t pt-2'>
              <span className='text-muted-foreground'>Entradas incluidas</span>
              <span className='font-medium'>{selectedCount}</span>
            </div>
            <div className='flex justify-between items-center text-sm border-t pt-2'>
              <span className='text-muted-foreground'>Moneda</span>
              <span className='font-medium'>{currency}</span>
            </div>
          </div>
        </div>

        <div className='space-y-2'>
          <p className='text-sm font-medium'>Método de retiro</p>
          <p className='text-xs text-muted-foreground'>
            Cuenta bancaria en Uruguay: tiene que ser en la misma moneda que tus
            ganancias (UYU o USD). Por ahora no aceptamos cuentas del exterior.
          </p>
          {compatibleMethods.length === 0 ? (
            <div className='rounded-lg border border-dashed p-4 text-center space-y-3'>
              <p className='text-sm text-muted-foreground'>
                No tenés métodos compatibles con {currency}
              </p>
              <Button variant='outline' size='sm' onClick={onAddMethod}>
                <Plus className='h-4 w-4 mr-1.5' />
                Agregar método
              </Button>
            </div>
          ) : (
            <div className='space-y-2'>
              {compatibleMethods.map(method => (
                <button
                  key={method.id}
                  type='button'
                  onClick={() => onPayoutMethodId(method.id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                    payoutMethodId === method.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'hover:bg-muted/50',
                  )}
                >
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium truncate'>
                      {getPayoutMethodDropdownText(method)}
                    </p>
                    {method.isDefault && (
                      <p className='text-xs text-muted-foreground'>
                        Por defecto
                      </p>
                    )}
                  </div>
                  {payoutMethodId === method.id && (
                    <Check className='h-4 w-4 text-primary shrink-0' />
                  )}
                </button>
              ))}
              <button
                type='button'
                onClick={onAddMethod}
                className='text-sm text-primary hover:underline'
              >
                + Agregar otro método
              </button>
            </div>
          )}
        </div>
      </div>

      <div className='border-t bg-background px-6 py-4 shrink-0 space-y-3'>
        <Button
          onClick={onSubmit}
          disabled={!payoutMethodId || requestPayoutPending}
          className='w-full'
        >
          {requestPayoutPending ? (
            <>
              <Loader2 className='h-4 w-4 mr-1.5 animate-spin' />
              Procesando...
            </>
          ) : (
            `Confirmar retiro · ${formatCurrency(String(selectedTotal), currency)}`
          )}
        </Button>
        <Button
          variant='ghost'
          onClick={onBack}
          className='w-full'
          disabled={requestPayoutPending}
        >
          <ArrowLeft className='h-4 w-4 mr-1.5' />
          Volver a seleccionar
        </Button>
      </div>
    </>
  );
}
