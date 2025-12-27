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
import {
  deleteTicketMutation,
  getMyListingsQuery,
} from '~/lib/api/ticket-listings';
import {AlertTriangle} from 'lucide-react';

interface RemoveTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  ticketNumber: number;
}

export function RemoveTicketDialog({
  open,
  onOpenChange,
  ticketId,
  ticketNumber,
}: RemoveTicketDialogProps) {
  const queryClient = useQueryClient();
  const deleteTicketMutationHook = useMutation(deleteTicketMutation(ticketId));

  const handleConfirm = async () => {
    try {
      await deleteTicketMutationHook.mutateAsync();
      await queryClient.invalidateQueries({
        queryKey: getMyListingsQuery().queryKey,
      });
      onOpenChange(false);
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
            Retirar ticket
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas retirar el ticket #{ticketNumber}? Esta
            acción no se puede deshacer y el ticket ya no estará disponible
            para la venta.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={deleteTicketMutationHook.isPending}
          >
            Cancelar
          </Button>
          <Button
            type='button'
            variant='destructive'
            onClick={handleConfirm}
            disabled={deleteTicketMutationHook.isPending}
          >
            {deleteTicketMutationHook.isPending
              ? 'Retirando...'
              : 'Retirar ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

