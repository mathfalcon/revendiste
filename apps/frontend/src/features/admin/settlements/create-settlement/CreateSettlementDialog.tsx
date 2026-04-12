import {useRef, useState} from 'react';
import {useForm, useWatch} from 'react-hook-form';
import {standardSchemaResolver} from '@hookform/resolvers/standard-schema';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import type {
  CreateSettlementRouteBody,
  PreviewSettlementResponse,
} from '~/lib/api/generated';
import {parse} from 'date-fns';
import {Loader2} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import {Button} from '~/components/ui/button';
import {Form} from '~/components/ui/form';
import {
  createSettlementMutation,
  previewSettlementMutation,
} from '~/lib/api/admin';
import {toast} from 'sonner';
import {
  createSettlementFormSchema,
  defaultCreateSettlementFormValues,
  type CreateSettlementFormValues,
} from './form-schema';
import {parseAmountInputToApiString} from './parse-amount-input';
import {SettlementProviderFormCard} from './SettlementProviderFormCard';
import {SettlementReconciliationCard} from './SettlementReconciliationCard';

export interface CreateSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSettlementDialog({
  open,
  onOpenChange,
}: CreateSettlementDialogProps) {
  const queryClient = useQueryClient();
  const amountDraftRef = useRef('');
  const [previewResult, setPreviewResult] =
    useState<PreviewSettlementResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateSettlementFormValues>({
    resolver: standardSchemaResolver(createSettlementFormSchema),
    defaultValues: defaultCreateSettlementFormValues,
  });

  const currency = useWatch({control: form.control, name: 'currency'});
  const settlementTimeValue = useWatch({
    control: form.control,
    name: 'settlementTime',
  });

  const handleSheetOpenChange = (next: boolean) => {
    if (next) {
      form.reset(defaultCreateSettlementFormValues);
      amountDraftRef.current = '';
      setPreviewResult(null);
    }
    onOpenChange(next);
  };

  const previewMutation = useMutation({
    ...previewSettlementMutation(),
    onSuccess: data => {
      setPreviewResult(data);
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
  });

  const onSubmit = form.handleSubmit(async values => {
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

    const payload: CreateSettlementRouteBody = {
      externalSettlementId: values.externalSettlementId.trim(),
      settlementDate: localCombined.toISOString(),
      totalAmount,
      currency: values.currency,
      ...(values.paymentProvider
        ? {paymentProvider: values.paymentProvider}
        : {}),
    };

    setIsSubmitting(true);
    try {
      const previewData = await previewMutation.mutateAsync(payload);
      setPreviewResult(previewData);
      if (previewData.hasBlockingError || previewData.duplicateExists) {
        toast.error(
          'La conciliación no permite crear esta liquidación. Corregí los datos o revisá el panel de vista previa.',
        );
        return;
      }
      await mutation.mutateAsync(payload);
    } catch (error: unknown) {
      const err = error as {response?: {data?: {message?: string}}};
      toast.error(
        err.response?.data?.message ||
          'No se pudo completar la vista previa o la creación',
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  const disableForm = mutation.isPending || isSubmitting;
  const previewLoading = isSubmitting && previewMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side='right'
        className='flex h-dvh w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg lg:max-w-4xl'
      >
        <SheetHeader className='shrink-0 space-y-1 border-b px-6 py-5 text-left'>
          <SheetTitle className='text-xl'>Nueva liquidación</SheetTitle>
          <SheetDescription>
            Completá los datos del depósito del procesador. Al confirmar, el
            sistema siempre llama primero a la vista previa de conciliación; solo
            continúa con el alta si no hay bloqueos.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={e => void onSubmit(e)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='min-h-0 flex-1 overflow-y-auto'>
              <div className='grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_min(100%,340px)] lg:items-start'>
                <SettlementProviderFormCard
                  form={form}
                  sheetOpen={open}
                  amountDraftRef={amountDraftRef}
                  settlementTimeValue={settlementTimeValue}
                  currency={currency}
                  disableForm={disableForm}
                />
                <SettlementReconciliationCard
                  previewResult={previewResult}
                  previewLoading={previewLoading}
                />
              </div>
            </div>

            <SheetFooter className='shrink-0 gap-2 border-t bg-background px-6 py-4 sm:flex-row sm:justify-end'>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleSheetOpenChange(false)}
                disabled={disableForm}
              >
                Cancelar
              </Button>
              <Button type='submit' disabled={disableForm}>
                {disableForm && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                Revisar y crear
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
