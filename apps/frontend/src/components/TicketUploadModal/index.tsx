import {useState, useEffect, useCallback} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/dialog';
import {Button} from '~/components/ui/button';
import {Progress} from '~/components/ui/progress';
import {
  Upload,
  Check,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Ticket,
  CheckCircle2,
} from 'lucide-react';
import {FileDropzone} from '~/components/FileDropzone';
import {
  uploadTicketDocumentMutation,
  updateTicketDocumentMutation,
  GetUserListingsResponse,
} from '~/lib';
import {toast} from 'sonner';
import {formatEventDate} from '~/utils/string';
import {cn} from '~/lib/utils';

type TicketWithListing = GetUserListingsResponse[number]['tickets'][number] & {
  listing: GetUserListingsResponse[number];
};

interface TicketUploadModalProps {
  /** Single ticket or array of tickets to upload */
  tickets: TicketWithListing | TicketWithListing[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Initial ticket ID to start with (for batch mode) */
  initialTicketId?: string;
}

export function TicketUploadModal({
  tickets: ticketsProp,
  open,
  onOpenChange,
  initialTicketId,
}: TicketUploadModalProps) {
  // Normalize to array
  const allTickets = Array.isArray(ticketsProp) ? ticketsProp : [ticketsProp];

  // Filter to tickets that can be uploaded
  const uploadableTickets = allTickets.filter(
    t => t.canUploadDocument && !t.hasDocument,
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  // Track the initial total for progress calculation (doesn't change after modal opens)
  const [initialTotal, setInitialTotal] = useState(0);
  const queryClient = useQueryClient();

  const isBatchMode = initialTotal > 1;
  const currentTicket = uploadableTickets[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === uploadableTickets.length - 1;
  const completedCount = completedIds.size;
  const progressPercent =
    initialTotal > 0 ? (completedCount / initialTotal) * 100 : 0;

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedFile(null);
      setCompletedIds(new Set());
      // Capture the initial total when modal opens (won't change during session)
      setInitialTotal(uploadableTickets.length);

      // Find initial index
      let startIndex = 0;
      if (initialTicketId) {
        const idx = uploadableTickets.findIndex(t => t.id === initialTicketId);
        if (idx >= 0) startIndex = idx;
      }
      setCurrentIndex(startIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialTicketId]);

  // Clear file when changing tickets
  useEffect(() => {
    setSelectedFile(null);
  }, [currentIndex]);

  const handleMutationSuccess = useCallback(() => {
    if (!currentTicket) return;

    // Mark as completed
    setCompletedIds(prev => new Set(prev).add(currentTicket.id));
    setSelectedFile(null);

    // Invalidate queries
    queryClient.invalidateQueries({queryKey: ['listings']});

    const newCompletedCount = completedCount + 1;

    // Show success
    toast.success(
      isBatchMode
        ? `Ticket #${currentTicket.ticketNumber} subido (${newCompletedCount}/${initialTotal})`
        : 'Ticket subido correctamente',
    );

    // Auto-advance in batch mode
    if (isBatchMode) {
      // Find next uncompleted ticket
      const nextIndex = uploadableTickets.findIndex(
        (t, idx) => idx > currentIndex && !completedIds.has(t.id),
      );

      if (nextIndex >= 0) {
        setCurrentIndex(nextIndex);
      } else if (newCompletedCount >= initialTotal) {
        // All done!
        setTimeout(() => {
          onOpenChange(false);
          toast.success('¡Todos los tickets subidos!', {
            description: `${initialTotal} tickets procesados correctamente`,
          });
        }, 500);
      }
    } else {
      // Single mode - close after success
      setTimeout(() => onOpenChange(false), 500);
    }
  }, [
    currentTicket,
    isBatchMode,
    completedCount,
    initialTotal,
    uploadableTickets,
    currentIndex,
    completedIds,
    queryClient,
    onOpenChange,
  ]);

  const uploadMutation = useMutation({
    ...uploadTicketDocumentMutation(currentTicket?.id || ''),
    onSuccess: handleMutationSuccess,
    onError: (error: Error) => {
      toast.error('Error al subir el ticket', {
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    ...updateTicketDocumentMutation(currentTicket?.id || ''),
    onSuccess: handleMutationSuccess,
    onError: (error: Error) => {
      toast.error('Error al actualizar el ticket', {
        description: error.message,
      });
    },
  });

  const mutation = currentTicket?.hasDocument ? updateMutation : uploadMutation;

  const handleUpload = () => {
    if (selectedFile) {
      mutation.mutate(selectedFile);
    }
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && !isFirst) {
      setCurrentIndex(currentIndex - 1);
    } else if (direction === 'next' && !isLast) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleClose = () => {
    if (mutation.isPending) return;
    onOpenChange(false);
  };

  // Empty state
  if (uploadableTickets.length === 0) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>No hay tickets pendientes</DialogTitle>
          </DialogHeader>
          <div className='flex flex-col items-center gap-4 py-6 text-center'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'>
              <CheckCircle2 className='h-6 w-6 text-green-600 dark:text-green-400' />
            </div>
            <p className='text-muted-foreground'>
              Todos los tickets ya tienen documentos subidos.
            </p>
          </div>
          <div className='flex justify-end'>
            <Button onClick={handleClose}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentTicket) return null;

  const event = currentTicket.listing.event;
  const ticketWave = currentTicket.listing.ticketWave;
  const isCompleted = completedIds.has(currentTicket.id);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-lg overflow-hidden'>
        <DialogHeader>
          <DialogTitle>
            {isBatchMode ? 'Subir tickets' : 'Subir ticket'}
          </DialogTitle>
          {isBatchMode && (
            <DialogDescription>
              {completedCount} de {uploadableTickets.length} completados
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Progress bar for batch mode */}
        {isBatchMode && <Progress value={progressPercent} className='h-1.5' />}

        {/* Ticket Info Card */}
        <div>
          <div
            className={cn(
              'rounded-lg border p-4 transition-colors',
              isCompleted
                ? 'border-green-500/30 bg-green-500/5'
                : 'border-orange-500/30 bg-orange-500/5',
            )}
          >
            <div className='flex items-start gap-4'>
              {/* Ticket number badge */}
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
                  isCompleted
                    ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                    : 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className='h-6 w-6' />
                ) : (
                  <Ticket className='h-6 w-6' />
                )}
              </div>

              {/* Event info */}
              <div className='min-w-0 flex-1 overflow-hidden'>
                <div className='flex items-center gap-2'>
                  <h3 className='font-semibold truncate min-w-0 flex-1'>
                    {event.name}
                  </h3>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                      isCompleted
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                        : 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
                    )}
                  >
                    #{currentTicket.ticketNumber}
                  </span>
                </div>
                <p className='text-sm text-muted-foreground mt-0.5 truncate'>
                  {ticketWave.name}
                </p>
                <div className='flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground'>
                  <div className='flex items-center gap-1 shrink-0'>
                    <Calendar className='h-3.5 w-3.5 shrink-0' />
                    <span className='whitespace-nowrap'>
                      {formatEventDate(new Date(event.eventStartDate))}
                    </span>
                  </div>
                  {event.venueName && (
                    <div className='flex items-center gap-1 min-w-0'>
                      <MapPin className='h-3.5 w-3.5 shrink-0' />
                      <span className='truncate'>{event.venueName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div>
          {isCompleted ? (
            <div className='flex flex-col items-center gap-3 py-8 text-center'>
              <div className='flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'>
                <Check className='h-8 w-8 text-green-600 dark:text-green-400' />
              </div>
              <p className='font-medium text-green-600 dark:text-green-400'>
                ¡Ticket subido correctamente!
              </p>
            </div>
          ) : (
            <FileDropzone
              onFileSelect={setSelectedFile}
              selectedFile={selectedFile}
              onClear={() => setSelectedFile(null)}
              accept='.pdf,.png,.jpg,.jpeg,.heic,.heif'
              acceptedMimeTypes={[
                'application/pdf',
                'image/png',
                'image/jpeg',
                'image/jpg',
                'image/heic',
                'image/heif',
              ]}
              maxFileSize={5 * 1024 * 1024}
              helperText={
                currentTicket.hasDocument
                  ? 'Esto reemplazará el documento existente'
                  : 'Sube una captura del código QR o PDF del ticket'
              }
              error={
                mutation.isError
                  ? mutation.error instanceof Error
                    ? mutation.error.message
                    : 'Error al procesar el archivo'
                  : null
              }
            />
          )}
        </div>

        {/* Footer with actions */}
        <div className='flex items-center justify-between gap-3 pt-2'>
          {/* Navigation (batch mode) */}
          {isBatchMode ? (
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleNavigate('prev')}
                disabled={isFirst || mutation.isPending}
              >
                <ChevronLeft className='h-4 w-4 mr-1' />
                Anterior
              </Button>

              <Button
                variant='outline'
                size='sm'
                onClick={() => handleNavigate('next')}
                disabled={isLast || mutation.isPending}
              >
                Siguiente
                <ChevronRight className='h-4 w-4 ml-1' />
              </Button>
            </div>
          ) : (
            <div />
          )}

          {/* Upload button */}
          {!isCompleted && (
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2' />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className='h-4 w-4 mr-2' />
                  {currentTicket.hasDocument ? 'Actualizar' : 'Subir'}
                </>
              )}
            </Button>
          )}

          {/* Continue/Close button for completed tickets in batch mode */}
          {isCompleted && isBatchMode && !isLast && (
            <Button onClick={() => handleNavigate('next')}>
              Siguiente ticket
              <ChevronRight className='h-4 w-4 ml-1' />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
