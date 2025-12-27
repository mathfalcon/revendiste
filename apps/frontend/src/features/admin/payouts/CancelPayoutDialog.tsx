import {useState} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {Button} from '~/components/ui/button';
import {Label} from '~/components/ui/label';
import {Textarea} from '~/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {cancelPayoutMutation} from '~/lib/api/admin';
import {toast} from 'sonner';
import {Loader2} from 'lucide-react';

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
  const [reasonType, setReasonType] = useState<'error' | 'other' | ''>('');
  const [failureReason, setFailureReason] = useState<string>('');

  const cancelMutation = useMutation({
    ...cancelPayoutMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin', 'payouts']});
      toast.success('Pago cancelado exitosamente');
      // Reset form
      setReasonType('');
      setFailureReason('');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al cancelar el pago',
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reasonType) {
      toast.error('Por favor selecciona un tipo de razón');
      return;
    }

    if (!failureReason.trim()) {
      toast.error('Por favor proporciona una razón para la cancelación');
      return;
    }

    cancelMutation.mutate({
      payoutId,
      reasonType: reasonType as 'error' | 'other',
      failureReason: failureReason.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Cancelar Pago</DialogTitle>
          <DialogDescription>
            Selecciona el motivo de la cancelación y proporciona una razón
            detallada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='reasonType'>Tipo de Razón *</Label>
            <Select
              value={reasonType}
              onValueChange={value => setReasonType(value as 'error' | 'other')}
            >
              <SelectTrigger id='reasonType'>
                <SelectValue placeholder='Selecciona un tipo de razón' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='error'>Error</SelectItem>
                <SelectItem value='other'>Otro motivo</SelectItem>
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground'>
              {reasonType === 'error'
                ? 'El pago se marcará como "Fallido" debido a un error (por ejemplo, datos incorrectos del usuario).'
                : reasonType === 'other'
                  ? 'El pago se marcará como "Cancelado" por otro motivo.'
                  : 'Selecciona si la cancelación es por un error o por otro motivo.'}
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='failureReason'>Razón de Cancelación *</Label>
            <Textarea
              id='failureReason'
              value={failureReason}
              onChange={e => setFailureReason(e.target.value)}
              placeholder='Describe la razón de la cancelación...'
              rows={5}
              required
            />
            <p className='text-xs text-muted-foreground'>
              Proporciona una descripción detallada de por qué se está
              cancelando este pago.
            </p>
          </div>

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
              disabled={cancelMutation.isPending || !reasonType || !failureReason.trim()}
            >
              {cancelMutation.isPending && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Confirmar Cancelación
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

