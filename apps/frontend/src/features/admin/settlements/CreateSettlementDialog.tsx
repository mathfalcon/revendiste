import {useEffect, useRef, useState} from 'react';
import {useForm, useWatch} from 'react-hook-form';
import {standardSchemaResolver} from '@hookform/resolvers/standard-schema';
import {z} from 'zod';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import type {PreviewSettlementResult} from '~/lib/api/generated';
import {format, parse} from 'date-fns';
import {es} from 'date-fns/locale';
import {Calendar as CalendarIcon, Loader2} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {Button} from '~/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import {Input} from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {Calendar} from '~/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import {cn} from '~/lib/utils';
import {Alert, AlertDescription, AlertTitle} from '~/components/ui/alert';
import {
  createSettlementMutation,
  previewSettlementMutation,
} from '~/lib/api/admin';
import {formatAmount, getCurrencySymbol} from '~/utils';
import {toast} from 'sonner';

/**
 * Parse admin amount input (es-UY: miles con punto, decimales con coma).
 * Returns canonical string with dot decimal for the API.
 */
function parseAmountInputToApiString(raw: string): string | null {
  const s = raw.replace(/\s/g, '');
  if (!s) return null;
  const cleaned = s.replace(/[^\d.,]/g, '');
  if (!cleaned) return null;

  const commaIdx = cleaned.lastIndexOf(',');
  if (commaIdx !== -1) {
    const intRaw = cleaned.slice(0, commaIdx);
    const fracRaw = cleaned.slice(commaIdx + 1);
    const intPart = intRaw.replace(/\./g, '').replace(/\D/g, '') || '0';
    const fracPart = fracRaw.replace(/\D/g, '').slice(0, 2);
    return fracPart ? `${intPart}.${fracPart}` : intPart;
  }

  const dotIdx = cleaned.lastIndexOf('.');
  if (dotIdx !== -1) {
    const after = cleaned.slice(dotIdx + 1);
    if (after.length <= 2 && /^\d+$/.test(after)) {
      const intPart =
        cleaned.slice(0, dotIdx).replace(/\./g, '').replace(/\D/g, '') || '0';
      return after ? `${intPart}.${after.slice(0, 2)}` : intPart;
    }
  }

  const intPart = cleaned.replace(/\./g, '').replace(/\D/g, '') || '0';
  return intPart === '0' && !/\d/.test(cleaned) ? null : intPart;
}

const defaultFormValues = {
  externalSettlementId: '',
  settlementDate: '',
  settlementTime: '12:00',
  totalAmount: '',
  currency: 'UYU' as const,
  paymentProvider: 'dlocal' as const,
};

const formSchema = z.object({
  externalSettlementId: z.string().min(1, 'El ID externo es requerido'),
  settlementDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Elegí una fecha'),
  settlementTime: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida'),
  totalAmount: z
    .string()
    .min(1, 'El monto es requerido')
    .refine(v => /^\d+(\.\d{1,2})?$/.test(v), {
      message: 'Usá hasta 2 decimales (ej. 1.234,56)',
    })
    .refine(v => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0;
    }, {
      message: 'El monto debe ser mayor a 0',
    }),
  currency: z.enum(['UYU', 'USD']),
  paymentProvider: z
    .enum(['dlocal', 'mercadopago', 'paypal', 'stripe'])
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SettlementAmountInput({
  value,
  onChange,
  onBlur,
  onRawChange,
  currency,
  disabled,
  dialogOpen,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  onRawChange: (raw: string) => void;
  currency: 'UYU' | 'USD';
  disabled?: boolean;
  dialogOpen: boolean;
}) {
  const [draft, setDraft] = useState('');
  const prevOpenRef = useRef(false);
  const symbol = getCurrencySymbol(currency);

  useEffect(() => {
    if (!dialogOpen) {
      prevOpenRef.current = false;
      return;
    }
    if (!prevOpenRef.current) {
      setDraft(value ? formatAmount(value) : '');
    }
    prevOpenRef.current = true;
  }, [dialogOpen, value]);

  return (
    <div className='relative'>
      <span
        className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground tabular-nums'
        aria-hidden
      >
        {symbol}
      </span>
      <Input
        className='pl-10 font-variant-numeric tabular-nums'
        inputMode='decimal'
        autoComplete='off'
        disabled={disabled}
        value={draft}
        onChange={e => {
          const next = e.target.value;
          setDraft(next);
          onRawChange(next);
          onChange(parseAmountInputToApiString(next) ?? '');
        }}
        onBlur={() => {
          const api = parseAmountInputToApiString(draft);
          if (api && Number(api) > 0) {
            onChange(api);
            onRawChange(formatAmount(api));
            setDraft(formatAmount(api));
          } else {
            onChange('');
            onRawChange('');
            setDraft('');
          }
          onBlur();
        }}
      />
    </div>
  );
}

export function CreateSettlementDialog({
  open,
  onOpenChange,
}: CreateSettlementDialogProps) {
  const queryClient = useQueryClient();
  const amountDraftRef = useRef('');
  const [previewResult, setPreviewResult] =
    useState<PreviewSettlementResult | null>(null);

  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  const currency = useWatch({control: form.control, name: 'currency'});

  const handleDialogOpenChange = (next: boolean) => {
    if (next) {
      form.reset(defaultFormValues);
      setPreviewResult(null);
    }
    onOpenChange(next);
  };

  const previewMutation = useMutation({
    ...previewSettlementMutation(),
    onSuccess: data => {
      setPreviewResult(data);
    },
    onError: (error: {response?: {data?: {message?: string}}}) => {
      toast.error(
        error.response?.data?.message || 'No se pudo previsualizar la conciliación',
      );
    },
  });

  const mutation = useMutation({
    ...createSettlementMutation(),
    onSuccess: data => {
      queryClient.invalidateQueries({queryKey: ['admin', 'settlements']});
      if (data.reconciliation?.hasWarning) {
        toast.warning(
          'Liquidación creada con una diferencia menor al 10% entre el monto declarado y la suma de créditos del procesador.',
        );
      } else {
        toast.success('Liquidación creada');
      }
      onOpenChange(false);
    },
    onError: (error: {response?: {data?: {message?: string}}}) => {
      toast.error(
        error.response?.data?.message || 'No se pudo crear la liquidación',
      );
    },
  });

  const onSubmit = (values: FormValues) => {
    let totalAmount = values.totalAmount.trim();
    if (!totalAmount) {
      totalAmount =
        parseAmountInputToApiString(amountDraftRef.current.trim()) ?? '';
    }
    if (!totalAmount || !/^\d+(\.\d{1,2})?$/.test(totalAmount)) {
      form.setError('totalAmount', {
        message: 'Ingresá un monto válido',
      });
      return;
    }
    const n = Number(totalAmount);
    if (!Number.isFinite(n) || n <= 0) {
      form.setError('totalAmount', {
        message: 'El monto debe ser mayor a 0',
      });
      return;
    }

    const localCombined = parse(
      `${values.settlementDate} ${values.settlementTime}`,
      'yyyy-MM-dd HH:mm',
      new Date(),
    );
    if (Number.isNaN(localCombined.getTime())) {
      form.setError('settlementDate', {message: 'Fecha u hora inválida'});
      return;
    }

    mutation.mutate({
      externalSettlementId: values.externalSettlementId.trim(),
      settlementDate: localCombined.toISOString(),
      totalAmount,
      currency: values.currency,
      ...(values.paymentProvider
        ? {paymentProvider: values.paymentProvider}
        : {}),
    });
  };

  const runPreview = form.handleSubmit(values => {
    let totalAmount = values.totalAmount.trim();
    if (!totalAmount) {
      totalAmount =
        parseAmountInputToApiString(amountDraftRef.current.trim()) ?? '';
    }
    if (!totalAmount || !/^\d+(\.\d{1,2})?$/.test(totalAmount)) {
      form.setError('totalAmount', {message: 'Ingresá un monto válido'});
      return;
    }
    const localCombined = parse(
      `${values.settlementDate} ${values.settlementTime}`,
      'yyyy-MM-dd HH:mm',
      new Date(),
    );
    if (Number.isNaN(localCombined.getTime())) {
      form.setError('settlementDate', {message: 'Fecha u hora inválida'});
      return;
    }
    previewMutation.mutate({
      externalSettlementId: values.externalSettlementId.trim(),
      settlementDate: localCombined.toISOString(),
      totalAmount,
      currency: values.currency,
      ...(values.paymentProvider
        ? {paymentProvider: values.paymentProvider}
        : {}),
    });
  });

  const blockingPreview =
    previewResult?.hasBlockingError || previewResult?.duplicateExists;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Nueva liquidación</DialogTitle>
          <DialogDescription>
            Se vinculan automáticamente los pagos del procesador (FIFO) hasta
            cubrir el monto que transferiste. Podés previsualizar la
            conciliación antes de guardar.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='externalSettlementId'
              render={({field}) => (
                <FormItem>
                  <FormLabel>ID de liquidación (externo)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Ej. según dLocal / proveedor'
                      autoComplete='off'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='settlementDate'
                render={({field}) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>Fecha</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type='button'
                            variant='outline'
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            <CalendarIcon className='mr-2 h-4 w-4' />
                            {field.value
                              ? format(
                                  parse(
                                    field.value,
                                    'yyyy-MM-dd',
                                    new Date(),
                                  ),
                                  'PPP',
                                  {locale: es},
                                )
                              : 'Elegí una fecha'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          locale={es}
                          selected={
                            field.value
                              ? parse(
                                  field.value,
                                  'yyyy-MM-dd',
                                  new Date(),
                                )
                              : undefined
                          }
                          onSelect={d =>
                            field.onChange(
                              d ? format(d, 'yyyy-MM-dd') : '',
                            )
                          }
                          defaultMonth={
                            field.value
                              ? parse(
                                  field.value,
                                  'yyyy-MM-dd',
                                  new Date(),
                                )
                              : new Date()
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='settlementTime'
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Hora</FormLabel>
                    <FormControl>
                      <Input type='time' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='totalAmount'
              render={({field}) => (
                <FormItem>
                  <FormLabel>Monto total</FormLabel>
                  <FormControl>
                    <SettlementAmountInput
                      dialogOpen={open}
                      value={field.value}
                      onChange={field.onChange}
                      onRawChange={raw => {
                        amountDraftRef.current = raw;
                      }}
                      onBlur={field.onBlur}
                      currency={currency}
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Debe coincidir aproximadamente con la suma de créditos
                    (balance) de los pagos incluidos.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='currency'
              render={({field}) => (
                <FormItem>
                  <FormLabel>Moneda</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='UYU'>UYU</SelectItem>
                      <SelectItem value='USD'>USD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='paymentProvider'
              render={({field}) => (
                <FormItem>
                  <FormLabel>Procesador</FormLabel>
                  <Select
                    value={field.value ?? 'dlocal'}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='dlocal'>dLocal</SelectItem>
                      <SelectItem value='mercadopago'>Mercado Pago</SelectItem>
                      <SelectItem value='paypal'>PayPal</SelectItem>
                      <SelectItem value='stripe'>Stripe</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex flex-col gap-3'>
              <Button
                type='button'
                variant='secondary'
                disabled={
                  previewMutation.isPending ||
                  mutation.isPending
                }
                onClick={() => void runPreview()}
              >
                {previewMutation.isPending && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                Vista previa de conciliación
              </Button>

              {previewResult && (
                <Alert
                  variant={
                    previewResult.hasBlockingError ||
                    previewResult.duplicateExists
                      ? 'destructive'
                      : previewResult.hasWarning
                        ? 'default'
                        : 'default'
                  }
                  className={cn(
                    !previewResult.hasBlockingError &&
                      !previewResult.duplicateExists &&
                      previewResult.hasWarning &&
                      'border-amber-500/50 bg-amber-500/10',
                    !previewResult.hasBlockingError &&
                      !previewResult.duplicateExists &&
                      !previewResult.hasWarning &&
                      'border-green-600/40 bg-green-500/10',
                  )}
                >
                  <AlertTitle>Conciliación estimada</AlertTitle>
                  <AlertDescription className='space-y-1 text-left'>
                    <p>
                      Pagos incluidos:{' '}
                      <strong>{previewResult.paymentCount}</strong>
                    </p>
                    <p>
                      Suma de créditos del procesador:{' '}
                      <strong>
                        {formatAmount(previewResult.computedTotal)}{' '}
                        {previewResult.currency}
                      </strong>
                    </p>
                    <p>
                      Monto declarado:{' '}
                      <strong>
                        {formatAmount(previewResult.declaredTotal)}{' '}
                        {previewResult.currency}
                      </strong>
                    </p>
                    <p>
                      Diferencia:{' '}
                      <strong>{previewResult.differencePercent}%</strong>
                    </p>
                    {previewResult.duplicateExists && (
                      <p>Ya existe una liquidación con este ID externo.</p>
                    )}
                    {previewResult.messageKey === 'NO_PAYMENTS' && (
                      <p>No hay pagos sin conciliar para esta moneda y fecha.</p>
                    )}
                    {previewResult.messageKey === 'INVALID_AMOUNT' && (
                      <p>Revisá el monto ingresado.</p>
                    )}
                    {previewResult.messageKey === 'MISMATCH' &&
                      !previewResult.duplicateExists && (
                        <p>
                          La diferencia supera el 10%: no se puede crear hasta
                          corregir el monto o revisar los pagos.
                        </p>
                      )}
                    {previewResult.messageKey === 'WARNING' && (
                      <p>
                        Diferencia entre 1% y 10%: podés crear igual; quedará
                        registrada como advertencia.
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className='gap-2 sm:gap-0'>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleDialogOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={
                  mutation.isPending || previewMutation.isPending || blockingPreview
                }
              >
                {mutation.isPending && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                Crear
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
