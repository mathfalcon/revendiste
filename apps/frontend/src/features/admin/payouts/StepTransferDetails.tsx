import {Button} from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {Label} from '~/components/ui/label';
import {CopyButton} from '~/components/ui/copy-button';
import {Alert, AlertDescription, AlertTitle} from '~/components/ui/alert';
import {formatCurrency} from '~/utils';
import {
  getBankName,
  getAccountNumber,
} from '~/features/user-account/payouts/payout-method-utils';
import {UruguayanBankMetadataSchema} from '@revendiste/shared/schemas/payout-methods';
import {ArrowLeft, ArrowRight, AlertTriangle} from 'lucide-react';
import type {GetPayoutDetailsResponse} from '~/lib/api/generated';

interface StepTransferDetailsProps {
  payout: GetPayoutDetailsResponse;
  onNext: () => void;
  onBack: () => void;
}

export function StepTransferDetails({
  payout,
  onNext,
  onBack,
}: StepTransferDetailsProps) {
  const payoutMethod = payout.payoutMethod;

  if (!payoutMethod) {
    return (
      <div className='space-y-4'>
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertTitle>Sin método de pago</AlertTitle>
          <AlertDescription>
            No hay datos de método de pago asociados a este retiro.
          </AlertDescription>
        </Alert>
        <div className='flex justify-between pt-2'>
          <Button
            type='button'
            variant='outline'
            className='cursor-pointer'
            onClick={onBack}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Atrás
          </Button>
        </div>
      </div>
    );
  }

  const bankName = payoutMethod.metadata
    ? getBankName(payoutMethod.metadata)
    : null;
  const accountNumber = payoutMethod.metadata
    ? getAccountNumber(payoutMethod.metadata)
    : null;

  const isUruguayanBank =
    payoutMethod.payoutType === 'uruguayan_bank' &&
    payoutMethod.metadata &&
    typeof payoutMethod.metadata === 'object' &&
    !Array.isArray(payoutMethod.metadata);

  const uruguayanBankMetadata = isUruguayanBank
    ? UruguayanBankMetadataSchema.safeParse(payoutMethod.metadata)
    : null;

  return (
    <div className='space-y-4'>
      <Card className='border-2 border-primary/20 bg-primary/3 shadow-sm'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg'>Datos para transferir</CardTitle>
          <CardDescription>
            Copiá y pegá en home banking.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <div className='flex flex-col gap-2 rounded-xl border-2 border-primary/30 bg-background p-5 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                Monto a enviar
              </p>
              <p className='text-3xl font-bold tabular-nums tracking-tight'>
                {formatCurrency(payout.amount, payout.currency)}
              </p>
            </div>
            <CopyButton
              text={`${payout.amount} ${payout.currency}`}
              size='sm'
              variant='outline'
              className='shrink-0 cursor-pointer'
            >
              <span className='ml-2'>Copiar monto</span>
            </CopyButton>
          </div>

          <div className='rounded-lg border bg-background p-3'>
            <Label className='text-xs text-muted-foreground'>Titular</Label>
            <p className='font-medium'>
              {payoutMethod.accountHolderName}{' '}
              {payoutMethod.accountHolderSurname}
            </p>
          </div>

          {payoutMethod.payoutType === 'uruguayan_bank' &&
            uruguayanBankMetadata?.success && (
              <>
                {bankName && (
                  <div className='rounded-lg border bg-background p-3'>
                    <Label className='text-xs text-muted-foreground'>
                      Banco
                    </Label>
                    <p>{bankName}</p>
                  </div>
                )}
                {accountNumber && (
                  <div className='flex items-start justify-between gap-2 rounded-lg border bg-background p-3'>
                    <div className='min-w-0'>
                      <Label className='text-xs text-muted-foreground'>
                        Cuenta
                      </Label>
                      <p className='font-mono break-all'>{accountNumber}</p>
                    </div>
                    <CopyButton text={accountNumber} size='sm' />
                  </div>
                )}
                <div className='rounded-lg border bg-background p-3'>
                  <Label className='text-xs text-muted-foreground'>
                    Moneda de la cuenta
                  </Label>
                  <p>{payoutMethod.currency}</p>
                </div>
              </>
            )}
        </CardContent>
      </Card>

      <div className='flex justify-between pt-2'>
        <Button
          type='button'
          variant='outline'
          className='cursor-pointer'
          onClick={onBack}
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Atrás
        </Button>
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
