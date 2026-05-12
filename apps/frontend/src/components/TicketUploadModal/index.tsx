import {useState, useEffect, useCallback, useRef} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {ANALYTICS_EVENTS, trackEvent} from '~/lib/analytics';
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

type TicketWithListing =
  GetUserListingsResponse['data'][number]['tickets'][number] & {
    listing: GetUserListingsResponse['data'][number];
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  // Key to force FileDropzone remount when changing tickets
  const [dropzoneKey, setDropzoneKey] = useState(0);
  // Track if all uploads are complete (show completion screen)
  const [allComplete, setAllComplete] = useState(false);
  // Capture the initial tickets when modal opens - doesn't change during session
  const [capturedTickets, setCapturedTickets] = useState<TicketWithListing[]>(
    [],
  );
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  // Use captured tickets for the session (stable reference)
  const uploadableTickets = capturedTickets;
  const initialTotal = capturedTickets.length;
  const isBatchMode = initialTotal > 1;
  const currentTicket = uploadableTickets[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === uploadableTickets.length - 1;
  const completedCount = completedIds.size;
  const progressPercent =
    initialTotal > 0 ? (completedCount / initialTotal) * 100 : 0;

  // Reset state and capture tickets when modal opens
  useEffect(() => {
    if (open) {
      // Normalize to array and filter uploadable tickets
      const allTickets = Array.isArray(ticketsProp)
        ? ticketsProp
        : [ticketsProp];
      const filteredTickets = allTickets.filter(
        t => t.canUploadDocument && !t.hasDocument,
      );

      // Capture tickets for this session
      setCapturedTickets(filteredTickets);
      setSelectedFile(null);
      setCompletedIds(new Set());
      setDropzoneKey(prev => prev + 1);
      setAllComplete(false);

      // Find initial index
      let startIndex = 0;
      if (initialTicketId) {
        const idx = filteredTickets.findIndex(t => t.id === initialTicketId);
        if (idx >= 0) startIndex = idx;
      }
      setCurrentIndex(startIndex);
    }

    // Cleanup timer on close
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialTicketId]);

  // Clear file and reset dropzone when changing tickets
  useEffect(() => {
    setSelectedFile(null);
    setDropzoneKey(prev => prev + 1);
  }, [currentIndex]);

  const handleMutationSuccess = useCallback(() => {
    if (!currentTicket) return;

    trackEvent(ANALYTICS_EVENTS.TICKET_DOCUMENT_UPLOADED, {
      ticket_id: currentTicket.id,
      is_update: currentTicket.hasDocument,
      is_batch: isBatchMode,
      batch_total: initialTotal,
    });

    // Calculate new state
    const newCompletedIds = new Set(completedIds).add(currentTicket.id);
    const newCompletedCount = newCompletedIds.size;
    const isAllDone = isBatchMode && newCompletedCount >= initialTotal;

    // Invalidate queries
    queryClient.invalidateQueries({queryKey: ['listings']});

    if (isBatchMode) {
      // Show success toast with position in queue (not database ticket number)
      toast.success(`Entrada subida (${newCompletedCount}/${initialTotal})`);

      if (isAllDone) {
        // All done! Set allComplete FIRST, then completedIds
        // This ensures the completion screen shows immediately without flash
        setAllComplete(true);
        setCompletedIds(newCompletedIds);
        setSelectedFile(null);

        // Auto-close after 3 seconds
        autoCloseTimerRef.current = setTimeout(() => {
          onOpenChange(false);
          toast.success('¡Todas las entradas subidas!', {
            description: `${initialTotal} entradas procesadas correctamente`,
          });
        }, 3000);
        return;
      }

      // Not all done - update state normally
      setCompletedIds(newCompletedIds);
      setSelectedFile(null);

      // Find next uncompleted ticket - first try after current index
      let nextIndex = uploadableTickets.findIndex(
        (t, idx) => idx > currentIndex && !newCompletedIds.has(t.id),
      );

      // If none found after current, wrap around to find any uncompleted ticket
      if (nextIndex < 0) {
        nextIndex = uploadableTickets.findIndex(
          t => !newCompletedIds.has(t.id),
        );
      }

      if (nextIndex >= 0) {
        // Auto-advance to next uncompleted ticket
        setCurrentIndex(nextIndex);
      }
    } else {
      // Single mode - close immediately with toast
      setCompletedIds(newCompletedIds);
      setSelectedFile(null);
      toast.success('Entrada subida correctamente');
      onOpenChange(false);
    }
  }, [
    currentTicket,
    isBatchMode,
    completedIds,
    initialTotal,
    uploadableTickets,
    currentIndex,
    queryClient,
    onOpenChange,
  ]);

  const uploadMutation = useMutation({
    ...uploadTicketDocumentMutation(currentTicket?.id || ''),
    onSuccess: handleMutationSuccess,
    onError: (error: Error) => {
      toast.error('Error al subir la entrada', {
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    ...updateTicketDocumentMutation(currentTicket?.id || ''),
    onSuccess: handleMutationSuccess,
    onError: (error: Error) => {
      toast.error('Error al actualizar la entrada', {
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
    // Clear auto-close timer if user closes manually
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    onOpenChange(false);
  };

  // Determine what content to show
  const showEmptyState = uploadableTickets.length === 0;
  const showAllCompleteState = allComplete && isBatchMode;
  const showUploadState = !showEmptyState && !showAllCompleteState;

  // Get current ticket data for upload state
  const event = currentTicket?.listing?.event;
  const ticketWave = currentTicket?.listing?.ticketWave;
  const isCompleted = currentTicket
    ? completedIds.has(currentTicket.id)
    : false;

  // Single Dialog - content changes based on state
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          'overflow-hidden',
          showEmptyState || showAllCompleteState
            ? 'sm:max-w-md'
            : 'sm:max-w-lg',
        )}
      >
        {/* Empty State Content */}
        {showEmptyState && (
          <>
            <DialogHeader>
              <DialogTitle>No hay entradas pendientes</DialogTitle>
            </DialogHeader>
            <div className='flex flex-col items-center gap-4 py-6 text-center'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'>
                <CheckCircle2 className='h-6 w-6 text-green-600 dark:text-green-400' />
              </div>
              <p className='text-muted-foreground'>
                Todas las entradas ya tienen documentos subidos.
              </p>
            </div>
            <div className='flex justify-end'>
              <Button onClick={handleClose}>Cerrar</Button>
            </div>
          </>
        )}

        {/* All Complete State Content */}
        {showAllCompleteState && (
          <>
            <DialogHeader>
              <DialogTitle>¡Completado!</DialogTitle>
            </DialogHeader>
            <div className='flex flex-col items-center gap-4 py-8 text-center'>
              <div className='flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'>
                <CheckCircle2 className='h-10 w-10 text-green-600 dark:text-green-400' />
              </div>
              <div>
                <p className='text-lg font-semibold text-green-600 dark:text-green-400'>
                  ¡Todas las entradas subidas!
                </p>
                <p className='text-sm text-muted-foreground mt-1'>
                  {initialTotal} entradas procesadas correctamente
                </p>
              </div>
            </div>
            <div className='flex justify-center'>
              <Button onClick={handleClose}>Cerrar</Button>
            </div>
          </>
        )}

        {/* Upload State Content */}
        {showUploadState && currentTicket && event && ticketWave && (
          <>
            <DialogHeader>
              <DialogTitle>
                {isBatchMode ? 'Subir entradas' : 'Subir entrada'}
              </DialogTitle>
              {isBatchMode && (
                <DialogDescription>
                  {completedCount} de {initialTotal} completados
                </DialogDescription>
              )}
            </DialogHeader>

            {/* Progress bar for batch mode */}
            {isBatchMode && (
              <Progress value={progressPercent} className='h-1.5' />
            )}

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
                    ¡Entrada subida correctamente!
                  </p>
                </div>
              ) : (
                <FileDropzone
                  key={dropzoneKey}
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
                      : 'Subí una captura del código QR o PDF de la entrada'
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
                  Siguiente entrada
                  <ChevronRight className='h-4 w-4 ml-1' />
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
