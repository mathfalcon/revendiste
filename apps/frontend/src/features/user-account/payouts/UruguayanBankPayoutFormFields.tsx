import {UseFormReturn} from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
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
import {
  URUGUAYAN_BANKS,
  type UruguayanBankName,
} from '@revendiste/shared';
import type {PayoutMethodFormValues} from './PayoutMethodForm';

interface UruguayanBankPayoutFormFieldsProps {
  form: UseFormReturn<PayoutMethodFormValues>;
}

export function UruguayanBankPayoutFormFields({
  form,
}: UruguayanBankPayoutFormFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name='currency'
        render={({field}) => (
          <FormItem>
            <FormLabel>Moneda</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder='Selecciona una moneda' />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value='UYU'>UYU - Peso Uruguayo</SelectItem>
                <SelectItem value='USD'>USD - Dólar Estadounidense</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='metadata.bank_name'
        render={({field}) => (
          <FormItem>
            <FormLabel>Nombre del Banco</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder='Selecciona un banco' />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {URUGUAYAN_BANKS.map((bank: UruguayanBankName) => (
                  <SelectItem key={bank} value={bank}>
                    {bank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='metadata.account_number'
        render={({field}) => (
          <FormItem>
            <FormLabel>Número de Cuenta</FormLabel>
            <FormControl>
              <Input placeholder='1234567890' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

