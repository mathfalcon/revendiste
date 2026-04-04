import {useCallback, useEffect, useRef, useState} from 'react';
import {useForm} from 'react-hook-form';
import {standardSchemaResolver} from '@hookform/resolvers/standard-schema';
import {z} from 'zod';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
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
import {PhoneInput} from '~/components/ui/phone-input';
import {CheckCircle2, MessageCircle, ArrowLeft} from 'lucide-react';
import {getCurrentUserQuery} from '~/lib/api/users';
import {
  sendWhatsappOtpMutation,
  verifyWhatsappOtpMutation,
} from '~/lib/api/profile';
import {toast} from 'sonner';

const DISMISS_KEY = 'revendiste:whatsapp-prompt-dismissed';
const SHOW_DELAY_MS = 3000;
const RESEND_COOLDOWN_S = 60;

type Step = 'phone' | 'otp' | 'success';

const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'El número de teléfono es requerido')
    .regex(
      /^\+?[1-9]\d{6,14}$/,
      'Ingresá un número de teléfono válido (ej: +5491112345678)',
    ),
});

const otpSchema = z.object({
  code: z
    .string()
    .length(6, 'El código debe tener 6 dígitos')
    .regex(/^\d{6}$/, 'Solo números'),
});

export function WhatsAppOptInModal() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dismissed, setDismissed] = useState(true); // default true to avoid flash
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {data: user} = useQuery(getCurrentUserQuery());

  // Check localStorage on mount (SSR-safe)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setDismissed(localStorage.getItem(DISMISS_KEY) === 'true');
  }, []);

  // Show modal after delay when conditions are met
  useEffect(() => {
    if (dismissed) return;
    if (!user) return;
    if (user.phoneNumber) return; // Already has phone = already opted in

    const timer = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [user, dismissed]);

  // Auto-close on success
  useEffect(() => {
    if (step !== 'success') return;
    const timer = setTimeout(() => {
      setOpen(false);
      setStep('phone');
    }, 2000);
    return () => clearTimeout(timer);
  }, [step]);

  // Cleanup cooldown interval
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN_S);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleDismissForever = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, 'true');
    }
    setDismissed(true);
    setOpen(false);
  }, []);

  // Phone form
  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: standardSchemaResolver(phoneSchema),
    defaultValues: {phoneNumber: ''},
  });

  const sendOtp = useMutation({
    ...sendWhatsappOtpMutation(),
    onSuccess: () => {
      setStep('otp');
      startCooldown();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Error al enviar el código. Intentá de nuevo.';
      toast.error(message);
    },
  });

  function onPhoneSubmit(values: z.infer<typeof phoneSchema>) {
    setPhoneNumber(values.phoneNumber);
    sendOtp.mutate({phoneNumber: values.phoneNumber});
  }

  // OTP form
  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: standardSchemaResolver(otpSchema),
    defaultValues: {code: ''},
  });

  const verifyOtp = useMutation({
    ...verifyWhatsappOtpMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['users', 'me']});
      setStep('success');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Código incorrecto. Intentá de nuevo.';
      otpForm.setError('code', {message});
    },
  });

  function onOtpSubmit(values: z.infer<typeof otpSchema>) {
    verifyOtp.mutate({code: values.code});
  }

  function handleResend() {
    if (resendCooldown > 0) return;
    otpForm.reset();
    sendOtp.mutate({phoneNumber});
  }

  return (
    <Dialog
      open={open}
      onOpenChange={value => {
        if (!value) {
          setOpen(false);
          // Reset to phone step when closing
          setStep('phone');
          phoneForm.reset();
          otpForm.reset();
        }
      }}
    >
      <DialogContent className='sm:max-w-md'>
        {step === 'phone' && (
          <>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <MessageCircle className='h-5 w-5 text-green-600' />
                Activar notificaciones de WhatsApp
              </DialogTitle>
              <DialogDescription>
                Recibí alertas importantes directo en tu WhatsApp, como
                recordatorios de subida de documentos y confirmaciones de venta.
              </DialogDescription>
            </DialogHeader>
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
                      <FormLabel>Número de WhatsApp</FormLabel>
                      <FormControl>
                        <PhoneInput
                          defaultCountry='UY'
                          placeholder='099 123 456'
                          value={field.value}
                          onChange={value => field.onChange(value || '')}
                        />
                      </FormControl>
                      <FormDescription>
                        Te enviaremos un código de verificación por WhatsApp.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type='submit'
                  className='w-full'
                  disabled={sendOtp.isPending}
                >
                  {sendOtp.isPending ? 'Enviando...' : 'Enviar código'}
                </Button>
              </form>
            </Form>
            <DialogFooter className='sm:justify-center'>
              <Button
                variant='link'
                size='sm'
                className='text-xs text-muted-foreground'
                onClick={handleDismissForever}
              >
                No me interesa, no preguntar de nuevo
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'otp' && (
          <>
            <DialogHeader>
              <DialogTitle>Ingresá el código</DialogTitle>
              <DialogDescription>
                Enviamos un código de 6 dígitos al {phoneNumber}
              </DialogDescription>
            </DialogHeader>
            <Form {...otpForm}>
              <form
                onSubmit={otpForm.handleSubmit(onOtpSubmit)}
                className='space-y-4'
              >
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
                <Button
                  type='submit'
                  className='w-full'
                  disabled={verifyOtp.isPending}
                >
                  {verifyOtp.isPending ? 'Verificando...' : 'Verificar'}
                </Button>
              </form>
            </Form>
            <div className='flex items-center justify-between'>
              <Button
                variant='ghost'
                size='sm'
                className='text-xs'
                onClick={() => {
                  setStep('phone');
                  otpForm.reset();
                }}
              >
                <ArrowLeft className='mr-1 h-3 w-3' />
                Cambiar número
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='text-xs'
                disabled={resendCooldown > 0 || sendOtp.isPending}
                onClick={handleResend}
              >
                {resendCooldown > 0
                  ? `Reenviar en ${resendCooldown}s`
                  : 'Reenviar código'}
              </Button>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className='flex flex-col items-center gap-3 py-6'>
            <CheckCircle2 className='h-12 w-12 text-green-600' />
            <p className='text-lg font-semibold'>¡WhatsApp activado!</p>
            <p className='text-sm text-muted-foreground text-center'>
              Vas a recibir notificaciones importantes en tu WhatsApp.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
