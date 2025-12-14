import {useMutation, useQueryClient} from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {Button} from '~/components/ui/button';
import {
  uploadTicketDocumentMutation,
  updateTicketDocumentMutation,
} from '~/lib';
import {TicketUploadForm} from '../TicketUploadCarousel/TicketUploadForm';

interface TicketDocumentUploadModalProps {
  ticketId: string;
  hasExistingDocument: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TicketDocumentUploadModal({
  ticketId,
  hasExistingDocument,
  open,
  onOpenChange,
}: TicketDocumentUploadModalProps) {
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    ...uploadTicketDocumentMutation(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['listings']});
      onOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    ...updateTicketDocumentMutation(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['listings']});
      onOpenChange(false);
    },
  });

  const mutation = hasExistingDocument ? updateMutation : uploadMutation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>
            {hasExistingDocument ? 'Actualizar' : 'Subir'} código del ticket
          </DialogTitle>
          <DialogDescription>ID: {ticketId}</DialogDescription>
        </DialogHeader>

        <TicketUploadForm
          ticketId={ticketId}
          hasExistingDocument={hasExistingDocument}
          mutation={mutation}
        />

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
