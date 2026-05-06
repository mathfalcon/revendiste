import type {MutableRefObject} from 'react';
import type {UseFormReturn} from 'react-hook-form';
import {FileSpreadsheet} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
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
import {Separator} from '~/components/ui/separator';
import {DateAndTimePicker} from '~/components/datetime-picker';
import {SettlementAmountInput} from './SettlementAmountInput';
import type {CreateSettlementFormValues} from './form-schema';

export interface SettlementProviderFormCardProps {
  form: UseFormReturn<CreateSettlementFormValues>;
  sheetOpen: boolean;
  amountDraftRef: MutableRefObject<string>;
  settlementTimeValue: string | undefined;
  currency: 'UYU' | 'USD';
  disableForm: boolean;
}

export function SettlementProviderFormCard({
  form,
  sheetOpen,
  amountDraftRef,
  settlementTimeValue,
  currency,
  disableForm,
}: SettlementProviderFormCardProps) {
  return (
    <Card className='shadow-sm'>
      <CardHeader className='space-y-1 pb-4'>
        <div className='flex items-center gap-2'>
          <FileSpreadsheet className='h-5 w-5 text-muted-foreground' />
          <CardTitle className='text-base'>Datos del proveedor</CardTitle>
        </div>
        <CardDescription>
          ID según el procesador, fecha del acreditado y monto transferido.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
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
                  disabled={disableForm}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='settlementDate'
          render={({field}) => (
            <FormItem className='flex flex-col'>
              <FormLabel>Fecha y hora</FormLabel>
              <FormControl>
                <DateAndTimePicker
                  dateValue={field.value}
                  timeValue={settlementTimeValue ?? '12:00'}
                  onDateChange={field.onChange}
                  onTimeChange={t =>
                    form.setValue('settlementTime', t, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  placeholder='Elegí fecha y hora de la liquidación'
                  disabled={disableForm}
                  disallowFuture
                />
              </FormControl>
              <FormMessage />
              {form.formState.errors.settlementTime?.message && (
                <p className='text-sm font-medium text-destructive'>
                  {form.formState.errors.settlementTime.message}
                </p>
              )}
            </FormItem>
          )}
        />

        <Separator />

        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField
            control={form.control}
            name='totalAmount'
            render={({field}) => (
              <FormItem className='sm:col-span-2'>
                <FormLabel>Monto total</FormLabel>
                <FormControl>
                  <SettlementAmountInput
                    sheetOpen={sheetOpen}
                    value={field.value}
                    onChange={field.onChange}
                    onRawChange={raw => {
                      amountDraftRef.current = raw;
                    }}
                    onBlur={field.onBlur}
                    currency={currency}
                    disabled={disableForm}
                  />
                </FormControl>
                <FormDescription>
                  Debe coincidir aproximadamente con la suma de créditos de los
                  pagos incluidos.
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
                  disabled={disableForm}
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
                  disabled={disableForm}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='dlocal'>dLocal</SelectItem>
                    <SelectItem value='mercadopago'>Mercado Pago</SelectItem>
                    <SelectItem value='stripe'>Stripe</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
