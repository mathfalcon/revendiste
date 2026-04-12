import {useEffect} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
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
import {Input} from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {Textarea} from '~/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import {
  adminPayoutDetailsQueryOptions,
  updatePayoutMutation,
} from '~/lib/api/admin';
import {toast} from 'sonner';
import {Loader2} from 'lucide-react';

// Form schema
const payoutEditFormSchema = z.object({
  status: z.enum([
    'pending',
    'requested',
    'processing',
    'completed',
    'failed',
    'cancelled',
  ]),
  processingFee: z.string().optional(),
  transactionReference: z.string().optional(),
  voucherUrl: z.string().optional(),
  notes: z.string().optional(),
});

type PayoutEditFormValues = z.infer<typeof payoutEditFormSchema>;

interface PayoutEditDialogProps {
  payoutId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PayoutEditDialog({
  payoutId,
  open,
  onOpenChange,
}: PayoutEditDialogProps) {
  const queryClient = useQueryClient();
  const {data: payout, isLoading} = useQuery(
    adminPayoutDetailsQueryOptions(payoutId),
  );

  // Form setup
  const form = useForm<PayoutEditFormValues>({
    resolver: standardSchemaResolver(payoutEditFormSchema),
    defaultValues: {
      status: 'pending',
      processingFee: '',
      transactionReference: '',
      voucherUrl: '',
      notes: '',
    },
  });

  // Initialize form when payout data loads
  useEffect(() => {
    if (payout) {
      form.reset({
        status: payout.status as PayoutEditFormValues['status'],
        processingFee: payout.processingFee || '',
        transactionReference: payout.transactionReference || '',
        voucherUrl:
          (payout.metadata as {voucherUrl?: string})?.voucherUrl || '',
        notes: payout.notes || '',
      });
    }
  }, [payout, form]);

  const updateMutation = useMutation({
    ...updatePayoutMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin', 'payouts']});
      toast.success('Retiro actualizado');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al actualizar el retiro',
      );
    },
  });

  const onSubmit = (data: PayoutEditFormValues) => {
    updateMutation.mutate({
      payoutId,
      updates: {
        status: data.status as any,
        processingFee: data.processingFee ? Number(data.processingFee) : undefined,
        notes: data.notes || undefined,
        voucherUrl: data.voucherUrl || undefined,
        transactionReference: data.transactionReference || undefined,
      },
    });
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className='flex items-center justify-center p-8'>
            <Loader2 className='h-6 w-6 animate-spin' />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!payout) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Editar Retiro</DialogTitle>
          <DialogDescription>
            Actualiza el estado del retiro, comisión de procesamiento, notas y
            comprobante
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='status'
              render={({field}) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='pending'>Pendiente</SelectItem>
                      <SelectItem value='requested'>Solicitado</SelectItem>
                      <SelectItem value='processing'>Procesando</SelectItem>
                      <SelectItem value='completed'>Completado</SelectItem>
                      <SelectItem value='failed'>Fallido</SelectItem>
                      <SelectItem value='cancelled'>Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='processingFee'
              render={({field}) => (
                <FormItem>
                  <FormLabel>Comisión de Procesamiento</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      step='0.01'
                      placeholder='0.00'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='transactionReference'
              render={({field}) => (
                <FormItem>
                  <FormLabel>Referencia de Transacción</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Referencia de transferencia bancaria'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='voucherUrl'
              render={({field}) => (
                <FormItem>
                  <FormLabel>URL del Comprobante</FormLabel>
                  <FormControl>
                    <Input type='url' placeholder='https://...' {...field} />
                  </FormControl>
                  <FormDescription>
                    URL del documento comprobante de transferencia bancaria
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='notes'
              render={({field}) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Notas adicionales...'
                      rows={4}
                      {...field}
                    />
                  </FormControl>
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
              <Button type='submit' disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                Guardar Cambios
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
