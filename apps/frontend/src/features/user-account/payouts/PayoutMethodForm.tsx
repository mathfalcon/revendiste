import {useEffect} from 'react';
import {type UseFormReturn, useForm} from 'react-hook-form';
import {standardSchemaResolver} from '@hookform/resolvers/standard-schema';
import {ANALYTICS_EVENTS, trackEvent} from '~/lib/analytics';
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
import {
  ArgentinianBankMetadataSchema,
  UruguayanBankMetadataSchema,
} from '@revendiste/shared';
import {UruguayanBankPayoutFormFields} from './UruguayanBankPayoutFormFields';
import {ArgentinianBankPayoutFormFields} from './ArgentinianBankPayoutFormFields';
import {Loader2} from 'lucide-react';
import {getBankName, getAccountNumber} from './payout-method-utils';
import {
  payoutMethodFormSchema,
  parseBankNameForForm,
  parsePayoutMethodMetadataForApi,
  type PayoutMethodFormValues,
} from './payout-method-form-schema';
import {useDlocalGoPayoutsEnabled} from '~/lib/dlocal-payout-flags';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  type GetPayoutMethodsResponse,
  type AddPayoutMethodRouteBody,
  PayoutType,
} from '~/lib/api/generated';

type PayoutMethodListItem = GetPayoutMethodsResponse[number];

export type {PayoutMethodFormValues} from './payout-method-form-schema';

interface PayoutMethodFormProps {
  methodId?: string;
  onSuccess?: () => void;
}

const emptyNewUruguayan = (): Extract<
  PayoutMethodFormValues,
  {payoutType: 'uruguayan_bank'}
> => ({
  payoutType: 'uruguayan_bank',
  accountHolderName: '',
  accountHolderSurname: '',
  currency: 'UYU',
  metadata: {bankName: '', accountNumber: ''},
  isDefault: false,
});

const emptyNewArgentinian = (): Extract<
  PayoutMethodFormValues,
  {payoutType: 'argentinian_bank'}
> => ({
  payoutType: 'argentinian_bank',
  accountHolderName: '',
  accountHolderSurname: '',
  currency: 'USD',
  metadata: {
    routing: 'cbu_cvu',
    bankCode: '007',
    accountOrAlias: '',
    documentType: 'CUIL',
    documentId: '',
  },
  isDefault: false,
});

function buildFormValuesFromExisting(
  m: PayoutMethodListItem,
): PayoutMethodFormValues {
  if (m.payoutType === PayoutType.ArgentinianBank) {
    const arParsed = ArgentinianBankMetadataSchema.safeParse(m.metadata);
    if (!arParsed.success) {
      return {
        ...emptyNewArgentinian(),
        accountHolderName: m.accountHolderName,
        accountHolderSurname: m.accountHolderSurname,
        isDefault: Boolean(m.isDefault),
        currency: m.currency === 'ARS' ? 'ARS' : 'USD',
      };
    }
    const meta = arParsed.data;
    if (meta.routing === 'cbu_cvu') {
      return {
        payoutType: 'argentinian_bank',
        accountHolderName: m.accountHolderName,
        accountHolderSurname: m.accountHolderSurname,
        currency: m.currency === 'ARS' ? 'ARS' : 'USD',
        isDefault: Boolean(m.isDefault),
        metadata: {
          routing: 'cbu_cvu',
          bankCode: meta.bankCode,
          accountOrAlias: meta.accountNumber,
          documentType: meta.document.type,
          documentId: meta.document.id,
        },
      };
    }
    return {
      payoutType: 'argentinian_bank',
      accountHolderName: m.accountHolderName,
      accountHolderSurname: m.accountHolderSurname,
      currency: m.currency === 'ARS' ? 'ARS' : 'USD',
      isDefault: Boolean(m.isDefault),
      metadata: {
        routing: 'alias',
        bankCode: '000',
        accountOrAlias: meta.alias,
        documentType: meta.document.type,
        documentId: meta.document.id,
      },
    };
  }

  const parsed = UruguayanBankMetadataSchema.safeParse(m.metadata);
  if (parsed.success) {
    return {
      payoutType: 'uruguayan_bank',
      accountHolderName: m.accountHolderName,
      accountHolderSurname: m.accountHolderSurname,
      currency: m.currency === 'USD' ? 'USD' : 'UYU',
      metadata: parsed.data,
      isDefault: Boolean(m.isDefault),
    };
  }

  return {
    payoutType: 'uruguayan_bank',
    accountHolderName: m.accountHolderName,
    accountHolderSurname: m.accountHolderSurname,
    currency: m.currency === 'USD' ? 'USD' : 'UYU',
    metadata: {
      bankName: parseBankNameForForm(getBankName(m.metadata)),
      accountNumber: getAccountNumber(m.metadata) ?? '',
    },
    isDefault: Boolean(m.isDefault),
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
  const dlocalPayoutsEnabled = useDlocalGoPayoutsEnabled();
  const existingMethod = useExistingMethod(methodId);
  const showPayoutTypeChoice = dlocalPayoutsEnabled && !methodId;

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
    defaultValues: emptyNewUruguayan(),
  });

  useEffect(() => {
    if (!methodId) {
      return;
    }
    if (!existingMethod) {
      return;
    }
    form.reset(buildFormValuesFromExisting(existingMethod));
  }, [methodId, existingMethod?.id, existingMethod?.updatedAt, form]);

  const payoutType = form.watch('payoutType');

  const onSubmit = async (data: PayoutMethodFormValues) => {
    if (methodId && existingMethod) {
      if (data.payoutType === 'uruguayan_bank') {
        await updateMethod.mutateAsync({
          payoutMethodId: methodId,
          data: {
            accountHolderName: data.accountHolderName,
            accountHolderSurname: data.accountHolderSurname,
            currency: data.currency,
            metadata: parsePayoutMethodMetadataForApi(data),
            isDefault: data.isDefault,
          },
        });
      } else {
        await updateMethod.mutateAsync({
          payoutMethodId: methodId,
          data: {
            accountHolderName: data.accountHolderName,
            accountHolderSurname: data.accountHolderSurname,
            currency: data.currency,
            metadata: parsePayoutMethodMetadataForApi(data),
            isDefault: data.isDefault,
          },
        });
      }
    } else {
      if (data.payoutType === 'uruguayan_bank') {
        const body: Extract<
          AddPayoutMethodRouteBody,
          {payoutType: 'uruguayan_bank'}
        > = {
          payoutType: 'uruguayan_bank',
          accountHolderName: data.accountHolderName,
          accountHolderSurname: data.accountHolderSurname,
          currency: data.currency,
          metadata: parsePayoutMethodMetadataForApi(data),
          isDefault: data.isDefault,
        };
        await addMethod.mutateAsync(body);
      } else {
        const body: Extract<
          AddPayoutMethodRouteBody,
          {payoutType: 'argentinian_bank'}
        > = {
          payoutType: 'argentinian_bank',
          accountHolderName: data.accountHolderName,
          accountHolderSurname: data.accountHolderSurname,
          currency: data.currency,
          metadata: parsePayoutMethodMetadataForApi(data),
          isDefault: data.isDefault,
        };
        await addMethod.mutateAsync(body);
      }
    }
    trackEvent(ANALYTICS_EVENTS.PAYOUT_METHOD_ADDED, {
      payout_type: data.payoutType,
      currency: data.currency,
      is_default: data.isDefault,
      action: methodId ? 'updated' : 'added',
    });
    if (!methodId) {
      form.reset(emptyNewUruguayan());
    } else {
      form.reset();
    }
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

        {showPayoutTypeChoice && (
          <FormField
            control={form.control}
            name='payoutType'
            render={({field}) => (
              <FormItem>
                <FormLabel>País de la cuenta bancaria</FormLabel>
                <Select
                  onValueChange={v => {
                    if (v === 'uruguayan_bank') {
                      const next: Extract<
                        PayoutMethodFormValues,
                        {payoutType: 'uruguayan_bank'}
                      > = {
                        ...emptyNewUruguayan(),
                        accountHolderName: form.getValues('accountHolderName'),
                        accountHolderSurname: form.getValues(
                          'accountHolderSurname',
                        ),
                        isDefault: form.getValues('isDefault'),
                      };
                      form.reset(next);
                    } else {
                      const next: Extract<
                        PayoutMethodFormValues,
                        {payoutType: 'argentinian_bank'}
                      > = {
                        ...emptyNewArgentinian(),
                        accountHolderName: form.getValues('accountHolderName'),
                        accountHolderSurname: form.getValues(
                          'accountHolderSurname',
                        ),
                        isDefault: form.getValues('isDefault'),
                      };
                      form.reset(next);
                    }
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='uruguayan_bank'>Uruguay</SelectItem>
                    <SelectItem value='argentinian_bank'>Argentina</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {payoutType === 'uruguayan_bank' && (
          <UruguayanBankPayoutFormFields form={form} />
        )}
        {payoutType === 'argentinian_bank' && (
          <ArgentinianBankPayoutFormFields
            form={
              form as UseFormReturn<
                Extract<
                  PayoutMethodFormValues,
                  {payoutType: 'argentinian_bank'}
                >
              >
            }
          />
        )}

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
