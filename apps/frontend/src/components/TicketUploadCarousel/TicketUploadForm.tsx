import {useState} from 'react';
import type {UseMutationResult} from '@tanstack/react-query';
import {Button} from '~/components/ui/button';
import {Upload, Check} from 'lucide-react';
import {FileDropzone} from '~/components/FileDropzone';

interface TicketUploadFormProps {
  ticketId: string;
  hasExistingDocument: boolean;
  mutation: UseMutationResult<any, any, File, any>;
}

export function TicketUploadForm({
  ticketId,
  hasExistingDocument,
  mutation,
}: TicketUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = () => {
    if (selectedFile) {
      mutation.mutate(selectedFile, {
        onSuccess: () => {
          setSelectedFile(null);
        },
      });
    }
  };

  const helperText = hasExistingDocument
    ? 'Esto reemplazará el documento existente. La versión anterior se mantendrá en el historial.'
    : 'Sube una captura del código QR del ticket o un archivo PDF según corresponda';

  return (
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
        helperText={helperText}
        error={
          mutation.isError
            ? mutation.error instanceof Error
              ? mutation.error.message
              : 'Error al procesar el archivo'
            : null
        }
      />

      <div className='flex justify-end'>
        <Button
          type='button'
          onClick={handleUpload}
          disabled={!selectedFile || mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
              {hasExistingDocument ? 'Actualizando...' : 'Subiendo...'}
            </>
          ) : (
            <>
              {hasExistingDocument ? (
                <>
                  <Check className='h-4 w-4' />
                  Actualizar
                </>
              ) : (
                <>
                  <Upload className='h-4 w-4' />
                  Subir
                </>
              )}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
