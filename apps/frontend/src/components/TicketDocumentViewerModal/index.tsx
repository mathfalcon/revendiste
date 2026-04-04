import {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {Button} from '~/components/ui/button';
import {
  getTicketInfoQuery,
  updateTicketDocumentMutation,
} from '~/lib/api/ticket-listings';
import {FileDropzone} from '~/components/FileDropzone';
import {Ticket, Upload, FileCheck, Clock, RefreshCw} from 'lucide-react';
import {toast} from 'sonner';
import {TextEllipsis} from '~/components/ui/text-ellipsis';
import {TicketIdHero} from '~/components/TicketViewModal/TicketIds';
import {DocumentPreview} from '~/components/TicketViewModal/DocumentPreview';

interface TicketDocumentViewerModalProps {
  ticketId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEventPast?: boolean;
}

export function TicketDocumentViewerModal({
  ticketId,
  open,
  onOpenChange,
  isEventPast = false,
}: TicketDocumentViewerModalProps) {
  const queryClient = useQueryClient();
  const [isReplacing, setIsReplacing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {data: ticketInfo, isPending} = useQuery({
    ...getTicketInfoQuery(ticketId),
    enabled: open && !!ticketId,
  });

  const updateMutation = useMutation({
    ...updateTicketDocumentMutation(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['ticket-info', ticketId]});
      queryClient.invalidateQueries({queryKey: ['listings']});
      setIsReplacing(false);
      setSelectedFile(null);
      onOpenChange(false);
      toast.success('Documento reemplazado correctamente');
    },
  });

  const handleUpload = () => {
    if (selectedFile) {
      updateMutation.mutate(selectedFile);
    }
  };

  const handleCancelReplace = () => {
    setIsReplacing(false);
    setSelectedFile(null);
  };

  const document = ticketInfo?.document;
  const hasDocument = !!document;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px] max-h-[calc(100dvh-2rem)] overflow-y-auto'>
        <DialogHeader className='text-left'>
          <DialogTitle className='flex items-center gap-2'>
            <Ticket className='h-5 w-5 shrink-0' />
            {ticketInfo?.event?.name ? (
              <TextEllipsis maxLines={1} className='text-lg font-semibold'>
                {ticketInfo.event.name}
              </TextEllipsis>
            ) : (
              'Documento de entrada'
            )}
          </DialogTitle>
        </DialogHeader>

        {isPending ? (
          <div className='flex items-center justify-center py-12'>
            <div className='h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
          </div>
        ) : (
          <div className='space-y-3'>
            <TicketIdHero
              ticketId={ticketId}
              waveName={ticketInfo?.ticketWave?.name}
            />

            {isReplacing ? (
              <div className='space-y-4'>
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
                  helperText='Esto reemplazará el documento existente. La versión anterior se mantendrá en el historial.'
                  error={
                    updateMutation.isError
                      ? updateMutation.error instanceof Error
                        ? updateMutation.error.message
                        : 'Error al procesar el archivo'
                      : null
                  }
                />

                <div className='flex justify-end gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleCancelReplace}
                    disabled={updateMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type='button'
                    onClick={handleUpload}
                    disabled={!selectedFile || updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className='h-4 w-4' />
                        Reemplazar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : hasDocument && document?.url ? (
              <div className='space-y-3'>
                <div className='flex items-center gap-2 text-sm'>
                  <FileCheck className='h-4 w-4 text-green-500' />
                  <span className='text-green-600 font-medium'>
                    Documento subido
                  </span>
                </div>
                <DocumentPreview
                  url={document.url}
                  ticketId={ticketId}
                  mimeType={document.mimeType}
                  originalName={document.originalName}
                />
                {!isEventPast && (
                  <div className='flex justify-center'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setIsReplacing(true)}
                    >
                      <RefreshCw className='h-4 w-4' />
                      Reemplazar documento
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className='rounded-lg border border-dashed bg-muted/30 p-6 text-center space-y-3'>
                <div className='flex justify-center'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
                    <Clock className='h-6 w-6 text-muted-foreground' />
                  </div>
                </div>
                <div className='space-y-1'>
                  <p className='font-medium text-foreground'>
                    Sin documento
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Todavía no subiste el documento para esta entrada.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
