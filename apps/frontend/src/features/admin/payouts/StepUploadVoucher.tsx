import {useState} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {Button} from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {FileDropzone} from '~/components/FileDropzone';
import {
  uploadPayoutDocumentMutation,
  deletePayoutDocumentMutation,
} from '~/lib/api/admin';
import {getFileIcon, formatFileSize} from '~/utils/file-icons';
import {
  ArrowLeft,
  ArrowRight,
  Download,
  ExternalLink,
  Loader2,
  Trash2,
  Upload,
  FileCheck,
} from 'lucide-react';
import {toast} from 'sonner';
import type {GetPayoutDetailsResponse} from '~/lib/api/generated';

interface StepUploadVoucherProps {
  payoutId: string;
  payout: GetPayoutDetailsResponse;
  onNext: () => void;
  onBack: () => void;
}

export function StepUploadVoucher({
  payoutId,
  payout,
  onNext,
  onBack,
}: StepUploadVoucherProps) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const invalidate = () => {
    void queryClient.invalidateQueries({queryKey: ['admin', 'payouts']});
    void queryClient.invalidateQueries({
      queryKey: ['admin', 'payouts', payoutId],
    });
  };

  const uploadMutation = useMutation({
    ...uploadPayoutDocumentMutation(),
    onSuccess: () => {
      invalidate();
      toast.success('Comprobante subido');
      setSelectedFile(null);
    },
    onError: (error: {response?: {data?: {message?: string}}}) => {
      toast.error(
        error.response?.data?.message ??
          'No se pudo subir el comprobante. Intentá de nuevo.',
      );
    },
  });

  const handleNext = async () => {
    if (selectedFile) {
      try {
        await uploadMutation.mutateAsync({payoutId, file: selectedFile});
      } catch {
        return;
      }
    }
    onNext();
  };

  const deleteDocMutation = useMutation({
    ...deletePayoutDocumentMutation(),
    onSuccess: () => {
      invalidate();
      toast.success('Comprobante eliminado');
    },
  });

  const hasDocuments = payout.documents && payout.documents.length > 0;

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg'>
            Comprobante de transferencia
          </CardTitle>
          <CardDescription>
            Subí el comprobante de la transferencia bancaria. Podés saltear este
            paso y subir después.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <FileDropzone
            onFileSelect={setSelectedFile}
            selectedFile={selectedFile}
            onClear={() => setSelectedFile(null)}
            accept='.pdf,.png,.jpg,.jpeg'
            acceptedMimeTypes={[
              'application/pdf',
              'image/png',
              'image/jpeg',
              'image/jpg',
            ]}
            maxFileSize={10 * 1024 * 1024}
            title='Arrastrá el comprobante o hacé clic para seleccionar'
            subtitle='PDF, PNG o JPG hasta 10 MB'
            disabled={uploadMutation.isPending}
            error={
              uploadMutation.isError
                ? uploadMutation.error instanceof Error
                  ? uploadMutation.error.message
                  : 'Error al subir el comprobante'
                : null
            }
          />
          {selectedFile ? (
            <Button
              type='button'
              variant='outline'
              className='cursor-pointer'
              disabled={uploadMutation.isPending}
              onClick={() =>
                uploadMutation.mutate({payoutId, file: selectedFile})
              }
            >
              {uploadMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Upload className='mr-2 h-4 w-4' />
              )}
              Subir ahora
            </Button>
          ) : null}

          {/* Existing documents */}
          {hasDocuments && (
            <div className='space-y-2'>
              <p className='text-sm font-medium text-muted-foreground'>
                Comprobantes subidos
              </p>
              {payout.documents!.map(doc => {
                const FileIcon = getFileIcon(doc.mimeType);
                return (
                  <div
                    key={doc.id}
                    className='flex items-center justify-between gap-2 rounded-lg border bg-muted/20 p-3'
                  >
                    <div className='flex min-w-0 items-center gap-2'>
                      <FileIcon className='h-4 w-4 shrink-0 text-muted-foreground' />
                      <span className='truncate text-sm'>
                        {doc.originalName}
                      </span>
                      <span className='text-xs text-muted-foreground shrink-0'>
                        {formatFileSize(doc.sizeBytes)}
                      </span>
                    </div>
                    <div className='flex shrink-0 gap-1'>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='cursor-pointer'
                        aria-label={`Abrir ${doc.originalName} en nueva pestaña`}
                        title='Abrir en nueva pestaña'
                        onClick={() =>
                          window.open(doc.url, '_blank', 'noopener,noreferrer')
                        }
                      >
                        <ExternalLink className='h-4 w-4' />
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='cursor-pointer'
                        asChild
                        aria-label={`Descargar ${doc.originalName}`}
                        title='Descargar'
                      >
                        <a
                          href={doc.url}
                          download={doc.originalName}
                          rel='noopener noreferrer'
                        >
                          <Download className='h-4 w-4' />
                        </a>
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='cursor-pointer text-destructive'
                        aria-label={`Eliminar ${doc.originalName}`}
                        title='Eliminar'
                        onClick={() => {
                          if (confirm('¿Eliminar este comprobante?')) {
                            deleteDocMutation.mutate({documentId: doc.id});
                          }
                        }}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasDocuments && (
            <div className='flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-800 dark:bg-green-900/20'>
              <FileCheck className='h-4 w-4 shrink-0 text-green-600' />
              <span className='text-green-800 dark:text-green-300'>
                {payout.documents!.length} comprobante
                {payout.documents!.length !== 1 ? 's' : ''} subido
                {payout.documents!.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className='flex justify-between pt-2'>
        <Button
          type='button'
          variant='outline'
          className='cursor-pointer'
          onClick={onBack}
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Atrás
        </Button>
        <Button
          type='button'
          className='cursor-pointer min-w-[160px]'
          disabled={uploadMutation.isPending}
          onClick={handleNext}
        >
          {uploadMutation.isPending ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : null}
          {selectedFile ? 'Subir y continuar' : 'Siguiente'}
          <ArrowRight className='ml-2 h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
