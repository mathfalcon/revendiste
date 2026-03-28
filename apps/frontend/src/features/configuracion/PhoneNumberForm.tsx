import {useForm} from 'react-hook-form';
import {standardSchemaResolver} from '@hookform/resolvers/standard-schema';
import {z} from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import {Input} from '~/components/ui/input';
import {Button} from '~/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {Phone} from 'lucide-react';

const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'El número de teléfono es requerido')
    .regex(
      /^\+?[1-9]\d{6,14}$/,
      'Ingresá un número de teléfono válido (ej: +5491112345678)',
    ),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;

export function PhoneNumberForm() {
  const form = useForm<PhoneFormValues>({
    resolver: standardSchemaResolver(phoneSchema),
    defaultValues: {
      phoneNumber: '',
    },
  });

  function onSubmit(_values: PhoneFormValues) {
    // TODO: connect to backend when phone management endpoint is implemented
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base flex items-center gap-2'>
          <Phone className='h-4 w-4' />
          Número de teléfono
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='phoneNumber'
              render={({field}) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='+5491112345678'
                      type='tel'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Incluí el código de país (ej: +54 para Argentina).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit' disabled>
              Guardar teléfono
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
