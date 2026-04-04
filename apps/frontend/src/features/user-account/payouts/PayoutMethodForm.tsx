import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {standardSchemaResolver} from '@hookform/resolvers/standard-schema';
import {usePostHog} from 'posthog-js/react';
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
import {Checkbox} from '~/components/ui/checkbox';
import {PayoutMethodBaseSchema} from '@revendiste/shared';
import {UruguayanBankPayoutFormFields} from './UruguayanBankPayoutFormFields';
import {PayPalPayoutFormFields} from './PayPalPayoutFormFields';
import {Loader2, Building2, CreditCard} from 'lucide-react';
import {cn} from '~/lib/utils';
import {getBankName, getAccountNumber, getEmail} from './payout-method-utils';

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

function buildDefaultValues(
  existingMethod: ReturnType<typeof useExistingMethod>,
): PayoutMethodFormValues {
  if (!existingMethod) {
    return {
      payoutType: 'uruguayan_bank' as const,
      accountHolderName: '',
      accountHolderSurname: '',
      currency: 'UYU',
      metadata: {bankName: '' as any, accountNumber: ''},
      isDefault: false,
    } as any;
  }

  if (existingMethod.payoutType === ('paypal' as string)) {
    return {
      payoutType: 'paypal' as const,
      accountHolderName: existingMethod.accountHolderName,
      accountHolderSurname: existingMethod.accountHolderSurname,
      currency: 'USD' as const,
      metadata: {email: getEmail(existingMethod.metadata) ?? ''},
      isDefault: existingMethod.isDefault,
    };
  }

  return {
    payoutType: 'uruguayan_bank' as const,
    accountHolderName: existingMethod.accountHolderName,
    accountHolderSurname: existingMethod.accountHolderSurname,
    currency: existingMethod.currency as 'UYU' | 'USD',
    metadata: {
      bankName: (getBankName(existingMethod.metadata) ?? '') as any,
      accountNumber: getAccountNumber(existingMethod.metadata) ?? '',
    },
    isDefault: existingMethod.isDefault,
  } as any;
}

function useExistingMethod(methodId?: string) {
  const {data: payoutMethods} = useQuery(getPayoutMethodsQuery());
  return methodId
    ? (payoutMethods?.find(m => m.id === methodId) ?? null)
    : null;
}

export function PayoutMethodForm({methodId, onSuccess}: PayoutMethodFormProps) {
  const queryClient = useQueryClient();
  const posthog = usePostHog();
  const existingMethod = useExistingMethod(methodId);

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
    resolver: standardSchemaResolver(payoutMethodSchema),
    defaultValues: buildDefaultValues(existingMethod),
  });

  const payoutType = form.watch('payoutType');

  const handlePayoutTypeChange = (newType: 'uruguayan_bank' | 'paypal') => {
    form.setValue('payoutType', newType);
    form.clearErrors();
    if (newType === 'uruguayan_bank') {
      form.setValue('currency', 'UYU');
      form.setValue('metadata', {
        bankName: '' as any,
        accountNumber: '',
      });
    } else {
      form.setValue('currency', 'USD');
      form.setValue('metadata', {email: ''});
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
    } else if (data.payoutType === 'uruguayan_bank') {
      const metadata = data.metadata as {
        bankName: string;
        accountNumber: string;
      };
      await addMethod.mutateAsync({
        payoutType: 'uruguayan_bank',
        accountHolderName: data.accountHolderName,
        accountHolderSurname: data.accountHolderSurname,
        currency: data.currency,
        metadata: {
          bankName: metadata.bankName as any,
          accountNumber: metadata.accountNumber,
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
    posthog.capture('payout_method_added', {
      payout_type: data.payoutType,
      currency: data.currency,
      is_default: data.isDefault,
      action: methodId ? 'updated' : 'added',
    });
    form.reset();
  };

  const isPending = addMethod.isPending || updateMethod.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
        {/* Payout type selector — card buttons instead of dropdown */}
        {!methodId && (
          <div className='space-y-2'>
            <FormLabel>Tipo de método</FormLabel>
            <div className='grid grid-cols-2 gap-3'>
              <button
                type='button'
                onClick={() => handlePayoutTypeChange('uruguayan_bank')}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors',
                  payoutType === 'uruguayan_bank'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'hover:bg-muted/50',
                )}
              >
                <Building2 className='h-5 w-5' />
                <span className='text-sm font-medium'>Banco uruguayo</span>
              </button>
              <button
                type='button'
                onClick={() => handlePayoutTypeChange('paypal')}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors',
                  payoutType === 'paypal'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'hover:bg-muted/50',
                )}
              >
                <CreditCard className='h-5 w-5' />
                <span className='text-sm font-medium'>PayPal</span>
              </button>
            </div>
          </div>
        )}

        {/* Common fields */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <FormField
            control={form.control}
            name='accountHolderName'
            render={({field}) => (
              <FormItem>
                <FormLabel>Nombre del titular</FormLabel>
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
                <FormLabel>Apellido del titular</FormLabel>
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

        {/* Default method checkbox */}
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
                <FormLabel>Usar como método por defecto</FormLabel>
                <FormDescription>
                  Se seleccionará automáticamente al solicitar retiros
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type='submit' disabled={isPending} className='w-full'>
          {isPending ? (
            <>
              <Loader2 className='h-4 w-4 mr-1.5 animate-spin' />
              Guardando...
            </>
          ) : methodId ? (
            'Guardar cambios'
          ) : (
            'Agregar método'
          )}
        </Button>
      </form>
    </Form>
  );
}
