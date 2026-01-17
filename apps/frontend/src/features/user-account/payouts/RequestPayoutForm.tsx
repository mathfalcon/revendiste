import {useForm} from 'react-hook-form';
import {standardSchemaResolver} from '@hookform/resolvers/standard-schema';
import {z} from 'zod';
import {useEffect} from 'react';
import {toast} from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '~/components/ui/form';
import {Button} from '~/components/ui/button';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {requestPayoutMutation, getPayoutMethodsQuery} from '~/lib/api/payouts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {Alert, AlertDescription} from '~/components/ui/alert';
import {Info} from 'lucide-react';
import {PayoutType} from '~/lib/api/generated';
import {getPayoutMethodDropdownText} from './payout-method-utils';

const requestPayoutSchema = z
  .object({
    payoutMethodId: z.string().min(1, 'Debes seleccionar un método de pago'),
    listingTicketIds: z.array(z.string()).optional(),
    listingIds: z.array(z.string()).optional(),
  })
  .refine(
    data =>
      (data.listingTicketIds?.length ?? 0) > 0 ||
      (data.listingIds?.length ?? 0) > 0,
    {
      message: 'Debes seleccionar al menos una ganancia',
      path: ['listingTicketIds'],
    },
  );

type RequestPayoutFormValues = z.infer<typeof requestPayoutSchema>;

interface RequestPayoutFormProps {
  selectedListingIds: string[];
  selectedTicketIds: string[];
  availableEarnings?: {
    byListing: Array<{
      listingId: string;
      currency: 'UYU' | 'USD';
      totalAmount: string;
    }>;
    byTicket: Array<{
      id: string;
      currency: 'UYU' | 'USD';
      sellerAmount: string;
    }>;
  };
  onSuccess?: () => void;
}

export function RequestPayoutForm({
  selectedListingIds,
  selectedTicketIds,
  availableEarnings,
  onSuccess,
}: RequestPayoutFormProps) {
  const queryClient = useQueryClient();
  const {data: payoutMethods} = useQuery(getPayoutMethodsQuery());
  const requestPayout = useMutation({
    ...requestPayoutMutation(),
    onSuccess: () => {
      toast.success('Solicitud de pago creada exitosamente');
      queryClient.invalidateQueries({queryKey: ['payouts']});
      onSuccess?.();
    },
  });

  const form = useForm<RequestPayoutFormValues>({
    resolver: standardSchemaResolver(requestPayoutSchema),
    defaultValues: {
      listingTicketIds: selectedTicketIds,
      listingIds: selectedListingIds,
    },
  });

  // Update form values when selected IDs change
  useEffect(() => {
    form.setValue('listingTicketIds', selectedTicketIds);
    form.setValue('listingIds', selectedListingIds);
  }, [selectedTicketIds, selectedListingIds, form]);

  const selectedPayoutMethodId = form.watch('payoutMethodId');
  const selectedPayoutMethod = payoutMethods?.find(
    m => m.id === selectedPayoutMethodId,
  );
  const defaultPayoutMethodId = payoutMethods?.find(m => m.isDefault)?.id;

  useEffect(() => {
    if (defaultPayoutMethodId) {
      form.setValue('payoutMethodId', defaultPayoutMethodId);
    }
  }, [defaultPayoutMethodId]);

  // Determine which currencies are in the selected earnings
  const selectedEarningsCurrencies = new Set<string>();
  if (availableEarnings) {
    availableEarnings.byListing
      .filter(l => selectedListingIds.includes(l.listingId))
      .forEach(l => selectedEarningsCurrencies.add(l.currency));
    availableEarnings.byTicket
      .filter(t => selectedTicketIds.includes(t.id))
      .forEach(t => selectedEarningsCurrencies.add(t.currency));
  }

  const hasUyuEarnings = selectedEarningsCurrencies.has('UYU');
  const hasUsdEarnings = selectedEarningsCurrencies.has('USD');

  // Check currency compatibility between earnings and payout method
  // - PayPal (USD) can receive both USD and UYU (UYU will be converted)
  // - UYU bank account can only receive UYU earnings
  // - USD bank account can only receive USD earnings
  const payoutMethodCurrency = selectedPayoutMethod?.currency;
  const isPayPal = selectedPayoutMethod?.payoutType === PayoutType.Paypal;

  // Currency mismatch: UYU method selected but has USD earnings
  const hasCurrencyMismatch =
    selectedPayoutMethod &&
    !isPayPal &&
    payoutMethodCurrency === 'UYU' &&
    hasUsdEarnings;

  // Currency mismatch: USD method selected but has UYU earnings (and not PayPal)
  const hasCurrencyMismatchUsdMethod =
    selectedPayoutMethod &&
    !isPayPal &&
    payoutMethodCurrency === 'USD' &&
    hasUyuEarnings;

  // Show conversion alert if PayPal is selected and UYU earnings are present
  const showConversionAlert = isPayPal && hasUyuEarnings;

  const onSubmit = async (data: RequestPayoutFormValues) => {
    await requestPayout.mutateAsync({
      payoutMethodId: data.payoutMethodId,
      listingTicketIds:
        data.listingTicketIds && data.listingTicketIds.length > 0
          ? data.listingTicketIds
          : undefined,
      listingIds:
        data.listingIds && data.listingIds.length > 0
          ? data.listingIds
          : undefined,
    });
    // Only reset form on success
    form.reset({
      payoutMethodId: '',
      listingTicketIds: [],
      listingIds: [],
    });
  };

  const onError = (errors: unknown) => {
    // Error is handled by axios interceptor (toast notification)
    // Form validation errors are handled by react-hook-form
    console.error('Error submitting payout request:', errors);
  };

  if (!payoutMethods || payoutMethods.length === 0) {
    return (
      <div className='rounded-lg border bg-card p-6 text-center'>
        <p className='text-muted-foreground mb-4'>
          Necesitas agregar un método de pago antes de solicitar un retiro
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onError)}
        className='space-y-4'
      >
        {/* Currency mismatch: UYU method with USD earnings */}
        {hasCurrencyMismatch && (
          <Alert variant='destructive'>
            <Info className='h-4 w-4' />
            <AlertDescription>
              No puedes solicitar un retiro de ganancias en USD a una cuenta
              bancaria en UYU. Por favor selecciona un método de pago en USD o
              PayPal, o selecciona solo ganancias en UYU.
            </AlertDescription>
          </Alert>
        )}

        {/* Currency mismatch: USD method with UYU earnings */}
        {hasCurrencyMismatchUsdMethod && (
          <Alert variant='destructive'>
            <Info className='h-4 w-4' />
            <AlertDescription>
              No puedes solicitar un retiro de ganancias en UYU a una cuenta
              bancaria en USD. Por favor selecciona un método de pago en UYU o
              PayPal, o selecciona solo ganancias en USD.
            </AlertDescription>
          </Alert>
        )}

        {/* Conversion alert for PayPal with UYU earnings */}
        {showConversionAlert && (
          <Alert>
            <Info className='h-4 w-4' />
            <AlertDescription>
              Tus ganancias en UYU se convertirán automáticamente a USD usando
              el tipo de cambio actual al procesar el pago. El monto final se
              calculará al momento de la solicitud.
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name='payoutMethodId'
          render={({field}) => {
            console.log(field);
            return (
              <FormItem>
                <FormLabel>Método de Pago</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={payoutMethods.find(m => m.isDefault)?.id ?? ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Selecciona un método de pago' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {payoutMethods.map(method => (
                      <SelectItem key={method.id} value={method.id}>
                        {getPayoutMethodDropdownText(method)}
                        {method.isDefault && ' (Por defecto)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Selecciona el método de pago donde recibirás el dinero
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        {(selectedListingIds.length > 0 || selectedTicketIds.length > 0) && (
          <div className='text-sm text-muted-foreground'>
            <p>
              Ganancias seleccionadas:{' '}
              {selectedListingIds.length > 0 && (
                <span>{selectedListingIds.length} publicación(es)</span>
              )}
              {selectedListingIds.length > 0 &&
                selectedTicketIds.length > 0 && <span> y </span>}
              {selectedTicketIds.length > 0 && (
                <span>{selectedTicketIds.length} ticket(s)</span>
              )}
            </p>
          </div>
        )}
        {/* Show validation error for earnings selection */}
        {form.formState.errors.listingTicketIds && (
          <p className='text-sm text-destructive'>
            {form.formState.errors.listingTicketIds.message}
          </p>
        )}

        <Button
          type='submit'
          disabled={
            requestPayout.isPending ||
            (selectedListingIds.length === 0 &&
              selectedTicketIds.length === 0) ||
            hasCurrencyMismatch ||
            hasCurrencyMismatchUsdMethod
          }
          className='w-full'
        >
          {requestPayout.isPending ? 'Procesando...' : 'Solicitar Pago'}
        </Button>
      </form>
    </Form>
  );
}
