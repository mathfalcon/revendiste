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
import {Input} from '~/components/ui/input';
import {Button} from '~/components/ui/button';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  addPayoutMethodMutation,
  updatePayoutMethodMutation,
  getPayoutMethodsQuery,
} from '~/lib/api/payouts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {Checkbox} from '~/components/ui/checkbox';
import {PayoutMethodBaseSchema} from '@revendiste/shared';
import {UruguayanBankPayoutFormFields} from './UruguayanBankPayoutFormFields';
import {PayPalPayoutFormFields} from './PayPalPayoutFormFields';

/**
 * Frontend form schema for payout methods
 * Extends the shared base schema with common fields
 * Uses nested metadata structure to match API expectations
 */
const payoutMethodSchema = PayoutMethodBaseSchema.and(
  z.object({
    accountHolderName: z.string().min(1, 'El nombre es requerido'),
    accountHolderSurname: z.string().min(1, 'El apellido es requerido'),
    currency: z.enum(['UYU', 'USD']),
    isDefault: z.boolean().optional(),
  }),
);

export type PayoutMethodFormValues = z.infer<typeof payoutMethodSchema>;

interface PayoutMethodFormProps {
  methodId?: string;
  onSuccess?: () => void;
}

export function PayoutMethodForm({methodId, onSuccess}: PayoutMethodFormProps) {
  const queryClient = useQueryClient();
  const {data: payoutMethods} = useQuery(getPayoutMethodsQuery());
  const existingMethod = methodId
    ? payoutMethods?.find(m => m.id === methodId)
    : null;

  const addMethod = useMutation({
    ...addPayoutMethodMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['payouts']});
      onSuccess?.();
    },
  });

  const updateMethod = useMutation({
    ...updatePayoutMethodMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['payouts']});
      onSuccess?.();
    },
  });

  const form = useForm<PayoutMethodFormValues>({
    resolver: zodResolver(payoutMethodSchema),
    defaultValues: existingMethod
      ? existingMethod.payoutType === ('paypal' as string)
        ? {
            payoutType: 'paypal' as const,
            accountHolderName: existingMethod.accountHolderName,
            accountHolderSurname: existingMethod.accountHolderSurname,
            currency: 'USD' as const,
            metadata: {
              email:
                existingMethod.metadata && 'email' in existingMethod.metadata
                  ? existingMethod.metadata.email
                  : '',
            },
            isDefault: existingMethod.isDefault,
          }
        : {
            payoutType: 'uruguayan_bank' as const,
            accountHolderName: existingMethod.accountHolderName,
            accountHolderSurname: existingMethod.accountHolderSurname,
            currency: existingMethod.currency as 'UYU' | 'USD',
            metadata:
              existingMethod.metadata &&
              'bank_name' in existingMethod.metadata &&
              'account_number' in existingMethod.metadata
                ? {
                    bank_name: existingMethod.metadata.bank_name,
                    account_number: existingMethod.metadata.account_number,
                  }
                : {
                    bank_name: undefined,
                    account_number: '',
                  },
            isDefault: existingMethod.isDefault,
          }
      : {
          payoutType: 'uruguayan_bank' as const,
          accountHolderName: '',
          accountHolderSurname: '',
          currency: 'UYU',
          metadata: {
            bank_name: undefined,
            account_number: '',
          },
          isDefault: false,
        },
  });

  const payoutType = form.watch('payoutType');

  // Reset metadata when payout type changes
  const handlePayoutTypeChange = (newType: 'uruguayan_bank' | 'paypal') => {
    form.setValue('payoutType', newType);

    // Reset metadata based on new type
    if (newType === 'uruguayan_bank') {
      form.setValue('currency', 'UYU');
      form.setValue('metadata', {
        bank_name: undefined as any, // Will be validated when form is submitted
        account_number: '',
      });
    } else {
      form.setValue('currency', 'USD');
      form.setValue('metadata', {
        email: '',
      });
    }
  };

  const onSubmit = async (data: PayoutMethodFormValues) => {
    if (methodId && existingMethod) {
      await updateMethod.mutateAsync({
        payoutMethodId: methodId,
        data: {
          accountHolderName: data.accountHolderName,
          accountHolderSurname: data.accountHolderSurname,
          currency: data.currency,
          metadata: data.metadata,
          isDefault: data.isDefault,
        },
      });
    } else {
      // TypeScript needs explicit narrowing for discriminated unions
      if (data.payoutType === 'uruguayan_bank') {
        await addMethod.mutateAsync({
          payoutType: 'uruguayan_bank',
          accountHolderName: data.accountHolderName,
          accountHolderSurname: data.accountHolderSurname,
          currency: data.currency,
          metadata: data.metadata as {
            bank_name: string;
            account_number: string;
          },
          isDefault: data.isDefault,
        });
      } else {
        await addMethod.mutateAsync({
          payoutType: 'paypal',
          accountHolderName: data.accountHolderName,
          accountHolderSurname: data.accountHolderSurname,
          currency: 'USD',
          metadata: data.metadata as {email: string},
          isDefault: data.isDefault,
        });
      }
    }
    form.reset();
  };

  const isPending = addMethod.isPending || updateMethod.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        {/* Step 1: Select payout type */}
        <FormField
          control={form.control}
          name='payoutType'
          render={({field}) => (
            <FormItem>
              <FormLabel>Tipo de Método de Pago</FormLabel>
              <Select
                onValueChange={value =>
                  handlePayoutTypeChange(value as 'uruguayan_bank' | 'paypal')
                }
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Selecciona un tipo de método' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='uruguayan_bank'>Banco Uruguayo</SelectItem>
                  <SelectItem value='paypal'>PayPal</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Step 2: Show form fields based on selected type */}
        {payoutType && (
          <>
            {/* Common fields for all payout types */}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='accountHolderName'
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder='Juan' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='accountHolderSurname'
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input placeholder='Pérez' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Type-specific fields */}
            {payoutType === 'uruguayan_bank' && (
              <UruguayanBankPayoutFormFields form={form} />
            )}

            {payoutType === 'paypal' && <PayPalPayoutFormFields form={form} />}

            {/* Common checkbox */}
            <FormField
              control={form.control}
              name='isDefault'
              render={({field}) => (
                <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel>Establecer como método por defecto</FormLabel>
                    <FormDescription>
                      Este método se usará automáticamente para nuevos pagos
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <Button type='submit' disabled={isPending} className='w-full'>
              {isPending
                ? 'Guardando...'
                : methodId
                  ? 'Actualizar Método'
                  : 'Agregar Método'}
            </Button>
          </>
        )}
      </form>
    </Form>
  );
}
