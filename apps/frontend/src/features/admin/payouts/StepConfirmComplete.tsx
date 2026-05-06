import {useForm} from 'react-hook-form';
import {standardSchemaResolver} from '@hookform/resolvers/standard-schema';
import {z} from 'zod';
import {Button} from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import {Input} from '~/components/ui/input';
import {Textarea} from '~/components/ui/textarea';
import {Separator} from '~/components/ui/separator';
import {PriceInput} from '~/components/ui/price-input';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import {formatCurrency} from '~/utils';
import {
  getBankName,
  getAccountNumber,
} from '~/features/user-account/payouts/payout-method-utils';
import {getArgentinianPayoutViewModel} from './argentinian-payout-helpers';
import {EventTicketCurrency} from '~/lib';
import {cn} from '~/lib/utils';
import {
  ArrowLeft,
  AlertTriangle,
  Check,
  Loader2,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import {useState} from 'react';
import type {GetPayoutDetailsResponse} from '~/lib/api/generated';

const processFormSchema = z.object({
  processingFee: z.coerce.number().min(0).optional(),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
  actualBankRate: z.string().optional(),
  actualUyuCost: z.string().optional(),
});

type ProcessFormValues = z.infer<typeof processFormSchema>;

function FxImpactIndicator({
  payoutAmountUsd,
  dLocalRate,
  actualBankRate,
  actualUyuCost,
}: {
  payoutAmountUsd: number;
  dLocalRate: number | null;
  actualBankRate: string | undefined;
  actualUyuCost: string | undefined;
}) {
  const bankRate = actualBankRate?.trim() ? Number(actualBankRate) : null;
  const uyuCost = actualUyuCost?.trim() ? Number(actualUyuCost) : null;

  if (!dLocalRate || dLocalRate <= 0) return null;

  const uyuReceivedFromDlocal = payoutAmountUsd * dLocalRate;

  // If actual UYU cost is provided, use it directly for the most accurate comparison
  // Otherwise fall back to computing from the bank rate
  let uyuSpent: number | null = null;
  if (uyuCost != null && Number.isFinite(uyuCost) && uyuCost > 0) {
    uyuSpent = uyuCost;
  } else if (bankRate != null && Number.isFinite(bankRate) && bankRate > 0) {
    uyuSpent = payoutAmountUsd * bankRate;
  }

  if (uyuSpent == null) return null;

  const diff = uyuReceivedFromDlocal - uyuSpent;
  const isGain = diff > 0;
  const isLoss = diff < 0;
  const isNeutral = Math.abs(diff) < 0.01;

  const Icon = isNeutral ? Minus : isGain ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        'rounded-lg border p-3 text-sm transition-colors',
        isGain &&
          'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
        isLoss &&
          'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
        isNeutral && 'border-border bg-muted/30',
      )}
    >
      <div className='flex items-center gap-2'>
        <Icon
          className={cn(
            'h-4 w-4 shrink-0',
            isGain && 'text-green-600 dark:text-green-400',
            isLoss && 'text-red-600 dark:text-red-400',
            isNeutral && 'text-muted-foreground',
          )}
        />
        <span
          className={cn(
            'font-semibold tabular-nums',
            isGain && 'text-green-700 dark:text-green-300',
            isLoss && 'text-red-700 dark:text-red-300',
            isNeutral && 'text-muted-foreground',
          )}
        >
          {isGain ? '+' : ''}
          {diff.toLocaleString('es-UY', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{' '}
          UYU
        </span>
        <span className='text-muted-foreground'>
          {isGain ? 'a favor' : isLoss ? 'en contra' : 'neutro'}
        </span>
      </div>
      <div className='mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground'>
        <span>dLocal nos liquidó</span>
        <span className='tabular-nums text-right'>
          {uyuReceivedFromDlocal.toLocaleString('es-UY', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{' '}
          UYU
        </span>
        <span>
          {uyuCost != null && Number.isFinite(uyuCost) && uyuCost > 0
            ? 'UYU gastados (real)'
            : `Costo a TC ${bankRate?.toFixed(2)}`}
        </span>
        <span className='tabular-nums text-right'>
          {uyuSpent.toLocaleString('es-UY', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{' '}
          UYU
        </span>
      </div>
    </div>
  );
}

function FxTrackingSection({
  form,
  payout,
}: {
  form: ReturnType<typeof useForm<ProcessFormValues>>;
  payout: GetPayoutDetailsResponse;
}) {
  const watchedBankRate = form.watch('actualBankRate');
  const watchedUyuCost = form.watch('actualUyuCost');

  const dLocalRate = payout.fxDecisionSupport.dLocalAverageExchangeRate;
  const payoutAmountUsd = Number(payout.amount);

  return (
    <>
      <Separator />
      <p className='text-sm font-medium'>Seguimiento FX</p>
      <FormField
        control={form.control}
        name='actualBankRate'
        render={({field}) => (
          <FormItem>
            <FormLabel>TC banco real (UYU/USD)</FormLabel>
            <FormControl>
              <Input
                type='number'
                step='any'
                placeholder='Ej. 43.2'
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='actualUyuCost'
        render={({field}) => (
          <FormItem>
            <FormLabel>UYU gastados al comprar USD</FormLabel>
            <FormControl>
              <Input
                type='number'
                step='any'
                placeholder='Opcional — si lo completás, se usa en vez del TC'
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FxImpactIndicator
        payoutAmountUsd={payoutAmountUsd}
        dLocalRate={dLocalRate}
        actualBankRate={watchedBankRate}
        actualUyuCost={watchedUyuCost}
      />
    </>
  );
}

interface StepConfirmCompleteProps {
  payout: GetPayoutDetailsResponse;
  onBack: () => void;
  onConfirm: (values: {
    processingFee?: number;
    transactionReference?: string;
    notes?: string;
    actualBankRate?: number;
    actualUyuCost?: number;
  }) => void;
  isProcessing: boolean;
}

export function StepConfirmComplete({
  payout,
  onBack,
  onConfirm,
  isProcessing,
}: StepConfirmCompleteProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const form = useForm<ProcessFormValues>({
    resolver: standardSchemaResolver(processFormSchema),
    defaultValues: {
      processingFee: 0,
      transactionReference: '',
      notes: '',
      actualBankRate: undefined,
      actualUyuCost: undefined,
    },
  });

  const payoutMethod = payout.payoutMethod;
  const bankName = payoutMethod?.metadata
    ? getBankName(payoutMethod.metadata)
    : null;
  const accountNumber = payoutMethod?.metadata
    ? getAccountNumber(payoutMethod.metadata)
    : null;
  const destination = (() => {
    if (payoutMethod?.payoutType === 'uruguayan_bank') {
      const parts = [bankName, accountNumber].filter(Boolean);
      return parts.length > 0 ? parts.join(' · ') : 'Banco';
    }
    if (
      payoutMethod?.payoutType === 'argentinian_bank' &&
      payoutMethod?.metadata
    ) {
      const v = getArgentinianPayoutViewModel(payoutMethod.metadata);
      if (v) {
        return (
          [v.bank, v.destination].filter(Boolean).join(' · ') || 'Argentina'
        );
      }
      return 'Cuenta bancaria Argentina';
    }
    return 'Método desconocido';
  })();

  const submitProcess = (values: ProcessFormValues) => {
    const updates: {
      processingFee?: number;
      transactionReference?: string;
      notes?: string;
      actualBankRate?: number;
      actualUyuCost?: number;
    } = {};

    if (values.processingFee && values.processingFee > 0) {
      updates.processingFee = values.processingFee;
    }
    if (values.transactionReference?.trim()) {
      updates.transactionReference = values.transactionReference.trim();
    }
    if (values.notes?.trim()) {
      updates.notes = values.notes.trim();
    }
    const br = values.actualBankRate?.trim();
    if (br) {
      const n = Number(br);
      if (Number.isFinite(n) && n > 0) updates.actualBankRate = n;
    }
    const uc = values.actualUyuCost?.trim();
    if (uc) {
      const n = Number(uc);
      if (Number.isFinite(n) && n >= 0) updates.actualUyuCost = n;
    }

    onConfirm(updates);
  };

  return (
    <div className='space-y-4'>
      {/* Summary card */}
      <Card className='border-2'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg'>Resumen del retiro</CardTitle>
          <CardDescription>
            Verificá los datos antes de confirmar.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <div className='flex items-center justify-between gap-4'>
            <span className='text-muted-foreground'>Monto</span>
            <span className='text-lg font-bold tabular-nums'>
              {formatCurrency(payout.amount, payout.currency)}
            </span>
          </div>
          <Separator />
          <div className='flex items-center justify-between gap-4'>
            <span className='text-muted-foreground'>Destino</span>
            <span className='font-medium text-right'>{destination}</span>
          </div>
          <div className='flex items-center justify-between gap-4'>
            <span className='text-muted-foreground'>Titular</span>
            <span className='text-right'>
              {payoutMethod?.accountHolderName}{' '}
              {payoutMethod?.accountHolderSurname}
            </span>
          </div>
          {payout.documents && payout.documents.length > 0 && (
            <>
              <Separator />
              <div className='flex items-center justify-between gap-4'>
                <span className='text-muted-foreground'>Comprobantes</span>
                <span>
                  {payout.documents.length} archivo
                  {payout.documents.length !== 1 ? 's' : ''}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Optional fields */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Campos opcionales</CardTitle>
          <CardDescription>
            Comisión, referencia, notas y seguimiento FX.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              id='confirm-process-form'
              className='space-y-4'
              onSubmit={form.handleSubmit(() => setConfirmOpen(true))}
            >
              <FormField
                control={form.control}
                name='processingFee'
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Comisión de procesamiento</FormLabel>
                    <FormControl>
                      <PriceInput
                        placeholder='0'
                        value={field.value || 0}
                        onChange={field.onChange}
                        locale='es-ES'
                        currency={
                          (payout.currency as EventTicketCurrency) ??
                          EventTicketCurrency.UYU
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='transactionReference'
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Referencia bancaria</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Referencia de la transferencia'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='notes'
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder='Notas internas (opcional)'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {payout.currency === 'USD' && (
                <FxTrackingSection form={form} payout={payout} />
              )}
            </form>
          </Form>
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
          type='submit'
          form='confirm-process-form'
          className='cursor-pointer min-w-[180px]'
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <Check className='mr-2 h-4 w-4' />
          )}
          Completar retiro
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-amber-500' />
              Confirmar procesamiento
            </AlertDialogTitle>
            <AlertDialogDescription className='space-y-2'>
              <span className='block'>
                Se marcará como completado el retiro de{' '}
                <strong className='text-foreground'>
                  {formatCurrency(payout.amount, payout.currency)}
                </strong>{' '}
                a {destination}.
              </span>
              <span className='block'>
                Las ganancias asociadas pasarán a estado pagado.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isProcessing}
              className='cursor-pointer'
            >
              Volver
            </AlertDialogCancel>
            <Button
              type='button'
              disabled={isProcessing}
              className='cursor-pointer'
              onClick={form.handleSubmit(submitProcess)}
            >
              {isProcessing && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Confirmar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
