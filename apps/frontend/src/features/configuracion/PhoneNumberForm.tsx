import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {standardSchemaResolver} from '@hookform/resolvers/standard-schema';
import {z} from 'zod';
import {useMutation, useQueryClient} from '@tanstack/react-query';
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
import {PhoneInput} from '~/components/ui/phone-input';
import {CheckCircle2, Phone} from 'lucide-react';
import {
  sendWhatsappOtpMutation,
  verifyWhatsappOtpMutation,
} from '~/lib/api/profile';
import {toast} from 'sonner';
import {NODE_ENV} from '~/config/env';

const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'El número de teléfono es requerido')
    .regex(/^\+?[1-9]\d{6,14}$/, 'Ingresá un número de teléfono válido'),
});

const otpSchema = z.object({
  code: z
    .string()
    .length(6, 'El código debe tener 6 dígitos')
    .regex(/^\d{6}$/, 'Solo números'),
});

type Step = 'idle' | 'otp' | 'success';

interface PhoneNumberFormProps {
  initialPhoneNumber?: string | null;
}

export function PhoneNumberForm({initialPhoneNumber}: PhoneNumberFormProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('idle');
  const [phoneNumber, setPhoneNumber] = useState('');

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: standardSchemaResolver(phoneSchema),
    defaultValues: {
      phoneNumber: initialPhoneNumber ?? '',
    },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: standardSchemaResolver(otpSchema),
    defaultValues: {code: ''},
  });

  const sendOtp = useMutation({
    ...sendWhatsappOtpMutation(),
    onSuccess: () => {
      setStep('otp');
      toast.success('Código enviado por WhatsApp');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Error al enviar el código.';
      toast.error(message);
    },
  });

  const verifyOtp = useMutation({
    ...verifyWhatsappOtpMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['users', 'me']});
      setStep('success');
      toast.success('Teléfono verificado');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Código incorrecto.';
      otpForm.setError('code', {message});
    },
  });

  function onPhoneSubmit(values: z.infer<typeof phoneSchema>) {
    setPhoneNumber(values.phoneNumber);
    sendOtp.mutate({phoneNumber: values.phoneNumber});
  }

  function onOtpSubmit(values: z.infer<typeof otpSchema>) {
    verifyOtp.mutate({code: values.code});
  }

  const hasVerifiedPhone = !!initialPhoneNumber;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base flex items-center gap-2'>
          <Phone className='h-4 w-4' />
          Número de teléfono
          {hasVerifiedPhone && step !== 'success' && (
            <span className='flex items-center gap-1 text-xs font-normal text-green-600'>
              <CheckCircle2 className='h-3 w-3' />
              Verificado
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === 'idle' && (
          <Form {...phoneForm}>
            <form
              onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
              className='space-y-4'
            >
              <FormField
                control={phoneForm.control}
                name='phoneNumber'
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <PhoneInput
                        defaultCountry='UY'
                        placeholder='099 123 456'
                        value={field.value}
                        onChange={value => field.onChange(value || '')}
                      />
                    </FormControl>
                    <FormDescription>
                      Tu número será utilizado para enviarte notificaciones
                      importantes por WhatsApp.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type='submit' disabled={sendOtp.isPending}>
                {sendOtp.isPending
                  ? 'Enviando código...'
                  : hasVerifiedPhone
                    ? 'Cambiar número'
                    : 'Verificar número'}
              </Button>
            </form>
          </Form>
        )}

        {step === 'otp' && (
          <Form {...otpForm}>
            <form
              onSubmit={otpForm.handleSubmit(onOtpSubmit)}
              className='space-y-4'
            >
              <p className='text-sm text-muted-foreground'>
                Enviamos un código de 6 dígitos al {phoneNumber}
              </p>
              <FormField
                control={otpForm.control}
                name='code'
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Código de verificación</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='123456'
                        maxLength={6}
                        inputMode='numeric'
                        autoComplete='one-time-code'
                        className='text-center text-lg tracking-widest'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='flex gap-2'>
                <Button type='submit' disabled={verifyOtp.isPending}>
                  {verifyOtp.isPending ? 'Verificando...' : 'Verificar'}
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => {
                    setStep('idle');
                    otpForm.reset();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        )}

        {step === 'success' && (
          <div className='flex items-center gap-3 py-2'>
            <CheckCircle2 className='h-8 w-8 text-green-600' />
            <div>
              <p className='font-medium'>Teléfono verificado</p>
              <p className='text-sm text-muted-foreground'>
                Vas a recibir notificaciones por WhatsApp en {phoneNumber}.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
