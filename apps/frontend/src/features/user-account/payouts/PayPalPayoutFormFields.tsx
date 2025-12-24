import {UseFormReturn} from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '~/components/ui/form';
import {Input} from '~/components/ui/input';
import type {PayoutMethodFormValues} from './PayoutMethodForm';

interface PayPalPayoutFormFieldsProps {
  form: UseFormReturn<PayoutMethodFormValues>;
}

export function PayPalPayoutFormFields({
  form,
}: PayPalPayoutFormFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name='currency'
        render={({field}) => (
          <FormItem>
            <FormLabel>Moneda</FormLabel>
            <FormControl>
              <Input value='USD' disabled />
            </FormControl>
            <FormDescription>
              PayPal solo soporta pagos en USD. Si necesitas recibir en UYU,
              usa un banco uruguayo.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='metadata.email'
        render={({field}) => (
          <FormItem>
            <FormLabel>Email de PayPal</FormLabel>
            <FormControl>
              <Input
                type='email'
                placeholder='usuario@example.com'
                {...field}
              />
            </FormControl>
            <FormDescription>
              Ingresa el email asociado a tu cuenta de PayPal
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

