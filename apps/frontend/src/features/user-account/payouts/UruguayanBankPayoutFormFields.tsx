import {useState} from 'react';
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
import {Popover, PopoverContent, PopoverTrigger} from '~/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command';
import {Button} from '~/components/ui/button';
import {Check, ChevronsUpDown} from 'lucide-react';
import {cn} from '~/lib/utils';
import {URUGUAYAN_BANKS, type UruguayanBankName} from '@revendiste/shared';
import type {PayoutMethodFormValues} from './PayoutMethodForm';

interface UruguayanBankPayoutFormFieldsProps {
  form: UseFormReturn<PayoutMethodFormValues>;
}

export function UruguayanBankPayoutFormFields({
  form,
}: UruguayanBankPayoutFormFieldsProps) {
  const [bankOpen, setBankOpen] = useState(false);

  return (
    <>
      <FormField
        control={form.control}
        name='currency'
        render={({field}) => (
          <FormItem>
            <FormLabel>Moneda de la cuenta</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder='Seleccioná la moneda' />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value='UYU'>UYU - Peso uruguayo</SelectItem>
                <SelectItem value='USD'>USD - Dólar estadounidense</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='metadata.bankName'
        render={({field}) => (
          <FormItem className='flex flex-col'>
            <FormLabel>Banco</FormLabel>
            <Popover open={bankOpen} onOpenChange={setBankOpen} modal>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant='outline'
                    role='combobox'
                    aria-expanded={bankOpen}
                    className={cn(
                      'w-full justify-between font-normal',
                      !field.value && 'text-muted-foreground',
                    )}
                  >
                    {field.value || 'Buscá tu banco...'}
                    <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent
                className='w-[--radix-popover-trigger-width] p-0'
                align='start'
              >
                <Command>
                  <CommandInput placeholder='Buscar banco...' />
                  <CommandList>
                    <CommandEmpty>No se encontró el banco.</CommandEmpty>
                    <CommandGroup>
                      {URUGUAYAN_BANKS.map((bank: UruguayanBankName) => (
                        <CommandItem
                          key={bank}
                          value={bank}
                          onSelect={() => {
                            form.setValue('metadata.bankName', bank as any, {
                              shouldValidate: true,
                            });
                            setBankOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              field.value === bank
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                          {bank}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='metadata.accountNumber'
        render={({field}) => (
          <FormItem>
            <FormLabel>Número de cuenta</FormLabel>
            <FormControl>
              <Input placeholder='Ej: 1234567' inputMode='numeric' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
