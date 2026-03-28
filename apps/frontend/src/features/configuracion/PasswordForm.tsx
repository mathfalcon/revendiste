import {useForm} from 'react-hook-form';
import {standardSchemaResolver} from '@hookform/resolvers/standard-schema';
import {z} from 'zod';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {
  getPasswordStatusQuery,
  setPasswordMutation,
  changePasswordMutation,
} from '~/lib/api/profile';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '~/components/ui/form';
import {Input} from '~/components/ui/input';
import {Button} from '~/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '~/components/ui/card';
import {Loader2} from 'lucide-react';

const setPasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

function SetPasswordForm() {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof setPasswordSchema>>({
    resolver: standardSchemaResolver(setPasswordSchema),
    defaultValues: {newPassword: '', confirmPassword: ''},
  });

  const setPassword = useMutation({
    ...setPasswordMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['profile', 'password-status']});
      form.reset();
    },
  });

  const onSubmit = async (data: z.infer<typeof setPasswordSchema>) => {
    await setPassword.mutateAsync(data.newPassword);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField
          control={form.control}
          name='newPassword'
          render={({field}) => (
            <FormItem>
              <FormLabel>Nueva contraseña</FormLabel>
              <FormControl>
                <Input type='password' placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({field}) => (
            <FormItem>
              <FormLabel>Confirmar contraseña</FormLabel>
              <FormControl>
                <Input type='password' placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' disabled={setPassword.isPending}>
          {setPassword.isPending && (
            <Loader2 className='h-4 w-4 animate-spin' />
          )}
          Crear contraseña
        </Button>
      </form>
    </Form>
  );
}

function ChangePasswordForm() {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: standardSchemaResolver(changePasswordSchema),
    defaultValues: {currentPassword: '', newPassword: '', confirmPassword: ''},
  });

  const changePassword = useMutation({
    ...changePasswordMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['profile', 'password-status']});
      form.reset();
    },
  });

  const onSubmit = async (data: z.infer<typeof changePasswordSchema>) => {
    await changePassword.mutateAsync({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField
          control={form.control}
          name='currentPassword'
          render={({field}) => (
            <FormItem>
              <FormLabel>Contraseña actual</FormLabel>
              <FormControl>
                <Input type='password' placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='newPassword'
          render={({field}) => (
            <FormItem>
              <FormLabel>Nueva contraseña</FormLabel>
              <FormControl>
                <Input type='password' placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({field}) => (
            <FormItem>
              <FormLabel>Confirmar nueva contraseña</FormLabel>
              <FormControl>
                <Input type='password' placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' disabled={changePassword.isPending}>
          {changePassword.isPending && (
            <Loader2 className='h-4 w-4 animate-spin' />
          )}
          Cambiar contraseña
        </Button>
      </form>
    </Form>
  );
}

export function PasswordForm() {
  const {data: passwordStatus, isLoading} = useQuery(getPasswordStatusQuery());

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse space-y-3'>
            <div className='h-10 bg-muted rounded' />
            <div className='h-10 bg-muted rounded' />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contraseña</CardTitle>
        <CardDescription>
          {passwordStatus?.hasPassword
            ? 'Cambiá tu contraseña actual.'
            : 'Configurá una contraseña para poder iniciar sesión con email y contraseña.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {passwordStatus?.hasPassword ? (
          <ChangePasswordForm />
        ) : (
          <SetPasswordForm />
        )}
      </CardContent>
    </Card>
  );
}
