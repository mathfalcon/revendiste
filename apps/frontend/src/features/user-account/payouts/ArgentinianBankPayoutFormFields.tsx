import {UseFormReturn} from 'react-hook-form';
import {
  FormControl,
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
import type {PayoutMethodFormValues} from './payout-method-form-schema';

type ArForm = Extract<PayoutMethodFormValues, {payoutType: 'argentinian_bank'}>;

export function ArgentinianBankPayoutFormFields({
  form,
}: {
  form: UseFormReturn<ArForm>;
}) {
  const routing = form.watch('metadata.routing');
  return (
    <div className='space-y-4 border rounded-lg p-3 bg-muted/20'>
      <p className='text-sm text-muted-foreground'>
        Cuenta bancaria en Argentina
      </p>

      <FormField
        control={form.control}
        name='metadata.routing'
        render={({field}) => (
          <FormItem>
            <FormLabel>Tipo de dato bancario</FormLabel>
            <Select
              onValueChange={v => {
                field.onChange(v);
                if (v === 'alias') {
                  form.setValue('metadata.bankCode', '000');
                  form.setValue('metadata.accountOrAlias', '');
                } else {
                  form.setValue('metadata.bankCode', '007');
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
                <SelectItem value='cbu_cvu'>CBU o CVU (22 dígitos)</SelectItem>
                <SelectItem value='alias'>CVU / alias bancario</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {routing === 'cbu_cvu' && (
        <FormField
          control={form.control}
          name='metadata.bankCode'
          render={({field}) => (
            <FormItem>
              <FormLabel>Banco (código BCRA, 3 dígitos)</FormLabel>
              <FormControl>
                <Input
                  maxLength={3}
                  inputMode='numeric'
                  placeholder='Ej. 007'
                  value={field.value}
                  onChange={e =>
                    field.onChange(
                      e.target.value.replace(/\D/g, '').slice(0, 3),
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {routing === 'cbu_cvu' ? (
        <FormField
          control={form.control}
          name='metadata.accountOrAlias'
          render={({field}) => (
            <FormItem>
              <FormLabel>CBU / CVU (22 dígitos)</FormLabel>
              <FormControl>
                <Input
                  inputMode='numeric'
                  autoComplete='off'
                  placeholder='Solo números'
                  value={field.value}
                  onChange={e =>
                    field.onChange(
                      e.target.value.replace(/\D/g, '').slice(0, 22),
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          control={form.control}
          name='metadata.accountOrAlias'
          render={({field}) => (
            <FormItem>
              <FormLabel>Alias bancario</FormLabel>
              <FormControl>
                <Input
                  autoComplete='off'
                  placeholder='Ej. juan.cuenta'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
        <FormField
          control={form.control}
          name='metadata.documentType'
          render={({field}) => (
            <FormItem>
              <FormLabel>Documento</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='CUIL'>CUIL</SelectItem>
                  <SelectItem value='CUIT'>CUIT</SelectItem>
                  <SelectItem value='DNI'>DNI</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='metadata.documentId'
          render={({field}) => (
            <FormItem>
              <FormLabel>N° de documento (sin guiones)</FormLabel>
              <FormControl>
                <Input autoComplete='off' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name='currency'
        render={({field}) => (
          <FormItem>
            <FormLabel>Moneda a recibir</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value='USD'>USD</SelectItem>
                <SelectItem value='ARS'>
                  ARS (cotizamos al solicitar el retiro)
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
