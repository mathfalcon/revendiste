import {useState, useEffect} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {Button} from '~/components/ui/button';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {
  uploadTicketDocumentMutation,
  updateTicketDocumentMutation,
  GetUserListingsResponse,
} from '~/lib';
import {TicketUploadForm} from './TicketUploadForm';

type TicketWithListing = GetUserListingsResponse[number]['tickets'][number] & {
  listing: GetUserListingsResponse[number];
};

interface TicketUploadCarouselProps {
  tickets: TicketWithListing[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
}

export function TicketUploadCarousel({
  tickets,
  open,
  onOpenChange,
  initialIndex = 0,
}: TicketUploadCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const queryClient = useQueryClient();

  // Filter to only tickets that need upload (can upload and don't have document)
  const ticketsNeedingUpload = tickets.filter(
    ticket => ticket.canUploadDocument && !ticket.hasDocument,
  );

  // Reset to first ticket when modal opens or when tickets list changes
  useEffect(() => {
    if (open && ticketsNeedingUpload.length > 0) {
      // If initialIndex is provided, try to find that ticket in the filtered list
      let validInitialIndex = 0;
      if (
        initialIndex !== undefined &&
        initialIndex >= 0 &&
        initialIndex < tickets.length
      ) {
        const targetTicket = tickets[initialIndex];
        if (targetTicket) {
          const foundIndex = ticketsNeedingUpload.findIndex(
            t => t.id === targetTicket.id,
          );
          if (foundIndex >= 0) {
            validInitialIndex = foundIndex;
          }
        }
      }
      setCurrentIndex(validInitialIndex);
    }
  }, [open, ticketsNeedingUpload.length, initialIndex, tickets]);

  const currentTicket = ticketsNeedingUpload[currentIndex];
  const hasMultipleTickets = ticketsNeedingUpload.length > 1;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === ticketsNeedingUpload.length - 1;

  const handleMutationSuccess = () => {
    queryClient.invalidateQueries({queryKey: ['listings']});
    // Auto-advance to next ticket if not last
    // Note: tickets list will update on next render from parent
    if (currentIndex < ticketsNeedingUpload.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // All done, close modal
      onOpenChange(false);
    }
  };

  const uploadMutation = useMutation({
    ...uploadTicketDocumentMutation(currentTicket?.id || ''),
    onSuccess: handleMutationSuccess,
  });

  const updateMutation = useMutation({
    ...updateTicketDocumentMutation(currentTicket?.id || ''),
    onSuccess: handleMutationSuccess,
  });

  const handleNext = () => {
    if (!isLast) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // If no tickets need upload, show message
  if (ticketsNeedingUpload.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>No hay tickets pendientes</DialogTitle>
            <DialogDescription>
              Todos los tickets ya tienen documentos subidos o no están
              disponibles para subir.
            </DialogDescription>
          </DialogHeader>
          <div className='flex justify-end'>
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentTicket) {
    return null;
  }

  const event = currentTicket.listing.event;
  const ticketWave = currentTicket.listing.ticketWave;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>
            {hasMultipleTickets
              ? `Subir ticket (${currentIndex + 1} de ${ticketsNeedingUpload.length})`
              : 'Subir ticket'}
          </DialogTitle>
          <DialogDescription className='mt-1'>
            <div className='space-y-1'>
              <p className='font-medium'>{event.name}</p>
              <p className='text-xs'>
                {ticketWave.name} - Ticket #{currentTicket.ticketNumber}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <TicketUploadForm
          ticketId={currentTicket.id}
          hasExistingDocument={currentTicket.hasDocument || false}
          mutation={currentTicket.hasDocument ? updateMutation : uploadMutation}
        />

        {/* Navigation */}
        {hasMultipleTickets && (
          <div className='flex items-center justify-between gap-2 border-t pt-4'>
            <Button
              onClick={handlePrevious}
              disabled={isFirst}
              variant='outline'
              size='sm'
            >
              <ChevronLeft className='h-4 w-4' />
              Anterior
            </Button>

            <Button
              onClick={handleNext}
              disabled={isLast}
              variant='outline'
              size='sm'
            >
              Siguiente
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
