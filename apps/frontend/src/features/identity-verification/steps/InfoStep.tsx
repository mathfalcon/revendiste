import {useMemo} from 'react';
import {useFormContext} from 'react-hook-form';
import {Check} from 'lucide-react';
import {Button} from '~/components/ui/button';
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
import {Combobox} from '~/components/Combobox';
import {cn} from '~/lib/utils';
import countriesData from '~/utils/countries.json';
import type {VerificationFormValues} from '../IdentityVerificationFlow';

interface CountryOption {
  value: string;
  label: string;
  code: string;
}

interface InfoStepProps {
  onSubmit: () => void;
  isPending: boolean;
}

export function InfoStep({onSubmit, isPending}: InfoStepProps) {
  const form = useFormContext<VerificationFormValues>();

  const watchDocumentType = form.watch('documentType');

  const countryOptions = useMemo<CountryOption[]>(() => {
    return countriesData.map(country => ({
      value: country.iso3,
      label: country.nameES,
      code: country.iso3,
    }));
  }, []);

  const getDocumentNumberPlaceholder = () => {
    switch (watchDocumentType) {
      case 'ci_uy':
        return '1.234.567-8';
      case 'dni_ar':
        return '12.345.678';
      case 'passport':
        return 'C123456';
      default:
        return 'Número de documento';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate only the fields for this step
    const isValid = await form.trigger(['documentType', 'documentNumber', 'documentCountry']);
    if (isValid) {
      onSubmit();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Primer paso</CardTitle>
        <CardDescription>
          Selecciona tu tipo de documento e ingresa el número
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <FormField
            control={form.control}
            name='documentType'
            render={({field}) => (
              <FormItem>
                <FormLabel>Tipo de documento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Selecciona...' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='ci_uy'>
                      Cédula de Identidad Uruguaya
                    </SelectItem>
                    <SelectItem value='dni_ar'>DNI Argentino</SelectItem>
                    <SelectItem value='passport'>Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Selecciona el tipo de documento que vas a verificar
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='documentNumber'
            render={({field}) => (
              <FormItem>
                <FormLabel>Número de documento</FormLabel>
                <FormControl>
                  <Input
                    placeholder={getDocumentNumberPlaceholder()}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Ingresa el número exactamente como aparece en tu documento
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchDocumentType === 'passport' && (
            <FormField
              control={form.control}
              name='documentCountry'
              render={({field}) => (
                <Combobox<CountryOption>
                  value={field.value}
                  onValueChange={field.onChange}
                  label='País del Pasaporte'
                  placeholder='Selecciona el país...'
                  searchPlaceholder='Buscar país...'
                  emptyMessage='No se encontró el país'
                  description='Selecciona el país emisor del pasaporte'
                  options={countryOptions}
                  renderSelectedValue={option => {
                    if (!option) return null;
                    return (
                      <span className='flex items-center gap-2'>
                        <span>{option.label}</span>
                        <span className='text-muted-foreground'>
                          ({option.code})
                        </span>
                      </span>
                    );
                  }}
                  renderOption={(option, isSelected) => (
                    <div className='flex items-center justify-between w-full'>
                      <div className='flex-1'>
                        <div className='font-medium'>{option.label}</div>
                        <div className='text-sm text-muted-foreground'>
                          {option.code}
                        </div>
                      </div>
                      <Check
                        className={cn(
                          'h-4 w-4 flex-shrink-0',
                          isSelected ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </div>
                  )}
                />
              )}
            />
          )}

          <Button
            type='submit'
            className='w-full'
            disabled={isPending || form.formState.isSubmitting}
          >
            {isPending ? 'Procesando...' : 'Continuar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
