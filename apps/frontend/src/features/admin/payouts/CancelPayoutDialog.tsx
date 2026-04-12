import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useForm} from 'react-hook-form';
import {standardSchemaResolver} from '@hookform/resolvers/standard-schema';
import {z} from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {Button} from '~/components/ui/button';
import {Textarea} from '~/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import {cancelPayoutMutation} from '~/lib/api/admin';
import {toast} from 'sonner';
import {Loader2} from 'lucide-react';

// Form schema
const cancelPayoutFormSchema = z.object({
  reasonType: z.enum(['error', 'other'], {
    message: 'Por favor selecciona un tipo de razón',
  }),
  failureReason: z.string().min(1, 'Por favor proporciona una razón para la cancelación'),
});

type CancelPayoutFormValues = z.infer<typeof cancelPayoutFormSchema>;

interface CancelPayoutDialogProps {
  payoutId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelPayoutDialog({
  payoutId,
  open,
  onOpenChange,
}: CancelPayoutDialogProps) {
  const queryClient = useQueryClient();

  // Form setup
  const form = useForm<CancelPayoutFormValues>({
    resolver: standardSchemaResolver(cancelPayoutFormSchema),
    defaultValues: {
      reasonType: undefined,
      failureReason: '',
    },
  });

  const reasonType = form.watch('reasonType');

  const cancelMutation = useMutation({
    ...cancelPayoutMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin', 'payouts']});
      toast.success('Retiro cancelado');
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al cancelar el retiro',
      );
    },
  });

  const onSubmit = (data: CancelPayoutFormValues) => {
    cancelMutation.mutate({
      payoutId,
      reasonType: data.reasonType,
      failureReason: data.failureReason.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Cancelar Retiro</DialogTitle>
          <DialogDescription>
            Selecciona el motivo de la cancelación y proporciona una razón
            detallada.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='reasonType'
              render={({field}) => (
                <FormItem>
                  <FormLabel>Tipo de Razón *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Selecciona un tipo de razón' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='error'>Error</SelectItem>
                      <SelectItem value='other'>Otro motivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {reasonType === 'error'
                      ? 'El retiro se marcará como "Fallido" debido a un error (por ejemplo, datos incorrectos del usuario).'
                      : reasonType === 'other'
                        ? 'El retiro se marcará como "Cancelado" por otro motivo.'
                        : 'Selecciona si la cancelación es por un error o por otro motivo.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='failureReason'
              render={({field}) => (
                <FormItem>
                  <FormLabel>Razón de Cancelación *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Describe la razón de la cancelación...'
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Proporciona una descripción detallada de por qué se está
                    cancelando este retiro.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                variant='destructive'
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                Confirmar Cancelación
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
