import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {Button} from '~/components/ui/button';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {deletePayoutMethodMutation} from '~/lib/api/payouts';
import {AlertTriangle} from 'lucide-react';
import {getPayoutMethodDisplayName} from './payout-method-utils';
import type {PayoutMethod} from '~/lib/api/generated';

interface DeletePayoutMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: PayoutMethod;
}

export function DeletePayoutMethodDialog({
  open,
  onOpenChange,
  method,
}: DeletePayoutMethodDialogProps) {
  const queryClient = useQueryClient();
  const deleteMethod = useMutation({
    ...deletePayoutMethodMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['payouts', 'payout-methods']});
      onOpenChange(false);
    },
  });

  const handleConfirm = async () => {
    try {
      await deleteMethod.mutateAsync(method.id);
    } catch (error) {
      // Error is handled by mutation's onError
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-destructive' />
            Eliminar método de pago
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar el método de pago{' '}
            <strong>{getPayoutMethodDisplayName(method)}</strong>? Esta acción
            no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={deleteMethod.isPending}
          >
            Cancelar
          </Button>
          <Button
            type='button'
            variant='destructive'
            onClick={handleConfirm}
            disabled={deleteMethod.isPending}
          >
            {deleteMethod.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

