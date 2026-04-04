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
import {Badge} from '~/components/ui/badge';
import type {PayoutMethodFormValues} from './PayoutMethodForm';

interface PayPalPayoutFormFieldsProps {
  form: UseFormReturn<PayoutMethodFormValues>;
}

export function PayPalPayoutFormFields({form}: PayPalPayoutFormFieldsProps) {
  return (
    <>
      <div className='flex items-center justify-between rounded-lg border p-3'>
        <span className='text-sm text-muted-foreground'>Moneda</span>
        <Badge variant='outline'>USD</Badge>
      </div>
      <p className='text-xs text-muted-foreground -mt-3'>
        PayPal solo opera en USD. Si necesitás recibir en UYU, usá un banco
        uruguayo.
      </p>

      <FormField
        control={form.control}
        name='metadata.email'
        render={({field}) => (
          <FormItem>
            <FormLabel>Email de PayPal</FormLabel>
            <FormControl>
              <Input type='email' placeholder='tu@email.com' {...field} />
            </FormControl>
            <FormDescription>
              El email asociado a tu cuenta de PayPal
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
