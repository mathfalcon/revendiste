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
import {
  getTicketInfoQuery,
  updateTicketDocumentMutation,
} from '~/lib/api/ticket-listings';
import {ImageWithLoading} from '~/components';
import {FileDropzone} from '~/components/FileDropzone';
import {
  FileCheck,
  Upload,
  ExternalLink,
  RefreshCw,
  Eye,
  X,
} from 'lucide-react';
import {VITE_APP_API_URL} from '~/config/env';

interface TicketDocumentViewerModalProps {
  ticketId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEventPast?: boolean;
}

// Helper function to check if a file is an image based on MIME type
function isImageFile(mimeType: string | null | undefined): boolean {
  if (!mimeType) return false;
  return mimeType.startsWith('image/');
}

// Helper function to construct full file URL
function getFullFileUrl(url: string): string {
  if (url.startsWith('/')) {
    const apiBase = VITE_APP_API_URL.replace('/api', '');
    return `${apiBase}${url}`;
  }
  return url;
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
  const documentUrl = document?.url ? getFullFileUrl(document.url) : null;
  const isImage = isImageFile(document?.mimeType);
  const isPdf = document?.mimeType === 'application/pdf';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Eye className='h-5 w-5' />
            {isReplacing ? 'Reemplazar documento' : 'Ver documento'}
          </DialogTitle>
          <DialogDescription>
            Ticket #{ticketInfo?.ticketNumber} - {ticketInfo?.ticketWave?.name}
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div className='flex items-center justify-center py-12'>
            <div className='h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
          </div>
        ) : !hasDocument ? (
          <div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
            <FileCheck className='h-12 w-12 mb-4 opacity-50' />
            <p>No hay documento subido</p>
          </div>
        ) : isReplacing ? (
          // Replace mode
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
        ) : (
          // View mode
          <div className='space-y-4'>
            {/* Document info */}
            <div className='flex items-center justify-between text-sm text-muted-foreground'>
              <div className='flex items-center gap-2'>
                <FileCheck className='h-4 w-4 text-green-500' />
                <span>{document.originalName}</span>
              </div>
              {document.uploadedAt && (
                <span>
                  Subido el{' '}
                  {new Date(document.uploadedAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>

            {/* Document preview */}
            {isImage && documentUrl && (
              <div className='rounded-lg border overflow-hidden bg-muted/30'>
                <ImageWithLoading
                  src={documentUrl}
                  alt={`Ticket ${ticketInfo?.ticketNumber}`}
                  className='w-full object-contain max-h-[400px]'
                  containerClassName='rounded-lg'
                  loadingOverlayClassName='rounded-lg'
                  minHeight={200}
                />
              </div>
            )}

            {isPdf && documentUrl && (
              <div className='rounded-lg border overflow-hidden bg-muted/30 p-8'>
                <div className='flex flex-col items-center justify-center gap-4'>
                  <FileCheck className='h-16 w-16 text-muted-foreground' />
                  <p className='text-sm text-muted-foreground'>
                    Archivo PDF: {document.originalName}
                  </p>
                  <Button variant='outline' asChild>
                    <a
                      href={documentUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <ExternalLink className='h-4 w-4' />
                      Abrir PDF en nueva pestaña
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className='flex justify-between pt-2'>
              <div>
                {documentUrl && (
                  <Button variant='outline' size='sm' asChild>
                    <a
                      href={documentUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <ExternalLink className='h-4 w-4' />
                      Abrir en nueva pestaña
                    </a>
                  </Button>
                )}
              </div>

              <div className='flex gap-2'>
                <Button variant='outline' onClick={() => onOpenChange(false)}>
                  Cerrar
                </Button>

                {/* Only show replace button for active events */}
                {!isEventPast && (
                  <Button onClick={() => setIsReplacing(true)}>
                    <RefreshCw className='h-4 w-4' />
                    Reemplazar
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
