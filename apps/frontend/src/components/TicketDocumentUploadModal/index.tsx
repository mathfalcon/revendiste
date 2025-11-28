import {useState, useRef} from 'react';
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
import {Alert, AlertDescription} from '~/components/ui/alert';
import {Upload, FileText, AlertCircle, Check} from 'lucide-react';
import {
  uploadTicketDocumentMutation,
  updateTicketDocumentMutation,
} from '~/lib';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    ...uploadTicketDocumentMutation(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['listings']});
      setSelectedFile(null);
      onOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    ...updateTicketDocumentMutation(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['listings']});
      setSelectedFile(null);
      onOpenChange(false);
    },
  });

  const mutation = hasExistingDocument ? updateMutation : uploadMutation;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];
    if (!validTypes.includes(file.type)) {
      return;
    }

    // Validate file size (10MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      mutation.mutate(selectedFile);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>
            {hasExistingDocument ? 'Actualizar' : 'Subir'} código del ticket
          </DialogTitle>
          <DialogDescription>ID: {ticketId}</DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              {hasExistingDocument
                ? 'Esto reemplazará el documento existente. La versión anterior se mantendrá en el historial.'
                : 'Sube una captura del código QR del ticket o un archivo PDF segun corresponda'}
              <br />
              <span className='text-xs text-muted-foreground'>
                Tamaño máximo: 5MB
              </span>
            </AlertDescription>
          </Alert>

          {/* Drop Zone */}
          <div
            className={`relative rounded-lg border-2 border-dashed transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25'
            } ${selectedFile ? 'bg-muted/50' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type='file'
              accept='.pdf,.png,.jpg,.jpeg'
              onChange={handleFileInputChange}
              className='hidden'
            />

            {!selectedFile ? (
              <div className='flex flex-col items-center justify-center p-8 text-center'>
                <Upload className='h-10 w-10 text-muted-foreground mb-4' />
                <p className='text-sm font-medium mb-1'>
                  Arrastra tu archivo aquí o haz clic para seleccionar
                </p>
                <p className='text-xs text-muted-foreground mb-4'>
                  PDF, PNG, JPG hasta 10MB
                </p>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => fileInputRef.current?.click()}
                >
                  Seleccionar archivo
                </Button>
              </div>
            ) : (
              <div className='flex items-center justify-between p-4'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-lg bg-primary/10 p-2'>
                    <FileText className='h-5 w-5 text-primary' />
                  </div>
                  <div>
                    <p className='text-sm font-medium'>{selectedFile.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => setSelectedFile(null)}
                >
                  Cambiar
                </Button>
              </div>
            )}
          </div>

          {mutation.isError && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : 'Error al procesar el archivo'}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
