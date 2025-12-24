import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
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
      queryClient.invalidateQueries({queryKey: ['payouts']});
      onSuccess?.();
    },
  });

  const form = useForm<RequestPayoutFormValues>({
    resolver: zodResolver(requestPayoutSchema),
    defaultValues: {
      payoutMethodId: '',
      listingTicketIds: selectedTicketIds,
      listingIds: selectedListingIds,
    },
  });

  const selectedPayoutMethodId = form.watch('payoutMethodId');
  const selectedPayoutMethod = payoutMethods?.find(
    m => m.id === selectedPayoutMethodId,
  );

  // Check if selected earnings include UYU
  const hasUyuEarnings =
    availableEarnings &&
    (availableEarnings.byListing.some(
      l => selectedListingIds.includes(l.listingId) && l.currency === 'UYU',
    ) ||
      availableEarnings.byTicket.some(
        t => selectedTicketIds.includes(t.id) && t.currency === 'UYU',
      ));

  // Show conversion alert if PayPal is selected and UYU earnings are present
  const showConversionAlert =
    selectedPayoutMethod?.payoutType === ('paypal' as string) && hasUyuEarnings;

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
    form.reset();
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
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
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
          render={({field}) => (
            <FormItem>
              <FormLabel>Método de Pago</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Selecciona un método de pago' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {payoutMethods.map(method => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.payoutType === ('paypal' as string)
                        ? 'PayPal'
                        : method.metadata &&
                          'bank_name' in method.metadata &&
                          method.metadata.bank_name}{' '}
                      - {method.currency}
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
          )}
        />

        <div className='text-sm text-muted-foreground'>
          <p>
            Ganancias seleccionadas:{' '}
            {selectedListingIds.length > 0 && (
              <span>{selectedListingIds.length} publicación(es)</span>
            )}
            {selectedListingIds.length > 0 && selectedTicketIds.length > 0 && (
              <span> y </span>
            )}
            {selectedTicketIds.length > 0 && (
              <span>{selectedTicketIds.length} ticket(s)</span>
            )}
          </p>
        </div>

        <Button
          type='submit'
          disabled={requestPayout.isPending}
          className='w-full'
        >
          {requestPayout.isPending ? 'Procesando...' : 'Solicitar Pago'}
        </Button>
      </form>
    </Form>
  );
}
