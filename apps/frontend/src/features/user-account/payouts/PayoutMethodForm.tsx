import {useForm} from 'react-hook-form';
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
import {UruguayanBankMetadataSchema} from '@revendiste/shared';
import {UruguayanBankPayoutFormFields} from './UruguayanBankPayoutFormFields';
import {Loader2} from 'lucide-react';
import {getBankName, getAccountNumber} from './payout-method-utils';
import {
  payoutMethodFormSchema,
  parseBankNameForForm,
  parsePayoutMethodMetadataForApi,
  type PayoutMethodFormValues,
} from './payout-method-form-schema';

export type {PayoutMethodFormValues} from './payout-method-form-schema';

interface PayoutMethodFormProps {
  methodId?: string;
  onSuccess?: () => void;
}

function buildDefaultValues(
  existingMethod: ReturnType<typeof useExistingMethod>,
): PayoutMethodFormValues {
  if (!existingMethod) {
    return {
      payoutType: 'uruguayan_bank',
      accountHolderName: '',
      accountHolderSurname: '',
      currency: 'UYU',
      metadata: {bankName: '', accountNumber: ''},
      isDefault: false,
    };
  }

  const parsed = UruguayanBankMetadataSchema.safeParse(existingMethod.metadata);
  if (parsed.success) {
    return {
      payoutType: 'uruguayan_bank',
      accountHolderName: existingMethod.accountHolderName,
      accountHolderSurname: existingMethod.accountHolderSurname,
      currency: existingMethod.currency === 'USD' ? 'USD' : 'UYU',
      metadata: parsed.data,
      isDefault: Boolean(existingMethod.isDefault),
    };
  }

  return {
    payoutType: 'uruguayan_bank',
    accountHolderName: existingMethod.accountHolderName,
    accountHolderSurname: existingMethod.accountHolderSurname,
    currency: existingMethod.currency === 'USD' ? 'USD' : 'UYU',
    metadata: {
      bankName: parseBankNameForForm(getBankName(existingMethod.metadata)),
      accountNumber: getAccountNumber(existingMethod.metadata) ?? '',
    },
    isDefault: Boolean(existingMethod.isDefault),
  };
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
    resolver: standardSchemaResolver(payoutMethodFormSchema),
    defaultValues: buildDefaultValues(existingMethod),
  });

  const onSubmit = async (data: PayoutMethodFormValues) => {
    const metadata = parsePayoutMethodMetadataForApi(data.metadata);
    if (methodId && existingMethod) {
      await updateMethod.mutateAsync({
        payoutMethodId: methodId,
        data: {
          accountHolderName: data.accountHolderName,
          accountHolderSurname: data.accountHolderSurname,
          currency: data.currency,
          metadata,
          isDefault: data.isDefault,
        },
      });
    } else {
      await addMethod.mutateAsync({
        payoutType: 'uruguayan_bank',
        accountHolderName: data.accountHolderName,
        accountHolderSurname: data.accountHolderSurname,
        currency: data.currency,
        metadata,
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

        <UruguayanBankPayoutFormFields form={form} />

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
