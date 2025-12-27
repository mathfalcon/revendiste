import {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {Button} from '~/components/ui/button';
import {Input} from '~/components/ui/input';
import {Label} from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {Textarea} from '~/components/ui/textarea';
import {
  adminPayoutDetailsQueryOptions,
  updatePayoutMutation,
  processPayoutMutation,
  completePayoutMutation,
  failPayoutMutation,
} from '~/lib/api/admin';
import {toast} from 'sonner';
import {Loader2} from 'lucide-react';

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

  const [status, setStatus] = useState<string>('');
  const [processingFee, setProcessingFee] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [voucherUrl, setVoucherUrl] = useState<string>('');
  const [transactionReference, setTransactionReference] = useState<string>('');

  // Initialize form when payout data loads
  if (payout && status === '') {
    setStatus(payout.status);
    setProcessingFee(payout.processingFee || '');
    setNotes(payout.notes || '');
    setVoucherUrl(
      (payout.metadata as {voucherUrl?: string})?.voucherUrl || '',
    );
    setTransactionReference(payout.transactionReference || '');
  }

  const updateMutation = useMutation({
    ...updatePayoutMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin', 'payouts']});
      toast.success('Pago actualizado exitosamente');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al actualizar el pago',
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      payoutId,
      updates: {
        status: status as any,
        processingFee: processingFee ? Number(processingFee) : undefined,
        notes: notes || undefined,
        voucherUrl: voucherUrl || null,
        transactionReference: transactionReference || undefined,
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
          <DialogTitle>Editar Pago</DialogTitle>
          <DialogDescription>
            Actualiza el estado del pago, comisión de procesamiento, notas y comprobante
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='status'>Estado</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id='status'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='pending'>Pendiente</SelectItem>
                <SelectItem value='processing'>Procesando</SelectItem>
                <SelectItem value='completed'>Completado</SelectItem>
                <SelectItem value='failed'>Fallido</SelectItem>
                <SelectItem value='cancelled'>Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='processingFee'>Comisión de Procesamiento</Label>
            <Input
              id='processingFee'
              type='number'
              step='0.01'
              value={processingFee}
              onChange={e => setProcessingFee(e.target.value)}
              placeholder='0.00'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='transactionReference'>Referencia de Transacción</Label>
            <Input
              id='transactionReference'
              value={transactionReference}
              onChange={e => setTransactionReference(e.target.value)}
              placeholder='Referencia de transferencia bancaria'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='voucherUrl'>URL del Comprobante</Label>
            <Input
              id='voucherUrl'
              type='url'
              value={voucherUrl}
              onChange={e => setVoucherUrl(e.target.value)}
              placeholder='https://...'
            />
            <p className='text-xs text-muted-foreground'>
              URL del documento comprobante de transferencia bancaria
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='notes'>Notas</Label>
            <Textarea
              id='notes'
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder='Notas adicionales...'
              rows={4}
            />
          </div>

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
      </DialogContent>
    </Dialog>
  );
}

