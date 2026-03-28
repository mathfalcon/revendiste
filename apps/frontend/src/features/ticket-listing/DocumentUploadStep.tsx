import {useState, useCallback, useEffect} from 'react';
import {Button} from '~/components/ui/button';
import {Progress} from '~/components/ui/progress';
import {FileDropzone} from '~/components/FileDropzone';
import {
  ArrowLeft,
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Ticket,
  CheckCircle2,
  FileText,
  ExternalLink,
} from 'lucide-react';
import {cn} from '~/lib/utils';
import {MobileDocumentBar} from './MobileDocumentBar';

const DOCUMENT_ACCEPTED_TYPES = '.pdf,.png,.jpg,.jpeg,.heic,.heif';
const DOCUMENT_ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/heic',
  'image/heif',
];
const DOCUMENT_MAX_SIZE = 5 * 1024 * 1024; // 5MB

function FilePreview({
  file,
  onReplace,
}: {
  file: File;
  onReplace?: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isImage = file.type.startsWith('image/');

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!previewUrl) return null;

  if (isImage) {
    return (
      <div className='space-y-2'>
        <div className='relative rounded-lg border overflow-hidden bg-muted/30'>
          <img
            src={previewUrl}
            alt={file.name}
            className='w-full max-h-[280px] object-contain'
          />
          {onReplace && (
            <Button
              variant='outline'
              size='icon'
              className='absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm'
              onClick={onReplace}
            >
              <ArrowDownUp className='h-4 w-4' />
            </Button>
          )}
        </div>
        <div className='flex items-center justify-between'>
          <p className='text-xs text-muted-foreground truncate max-w-[60%]'>
            {file.name}
          </p>
          <Button
            variant='ghost'
            size='sm'
            className='text-xs h-7'
            onClick={() => window.open(previewUrl, '_blank')}
          >
            <ExternalLink className='h-3.5 w-3.5 mr-1' />
            Abrir
          </Button>
        </div>
      </div>
    );
  }

  // PDF or other file type
  return (
    <div className='flex items-center gap-3 rounded-lg border bg-muted/30 p-4'>
      <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10'>
        <FileText className='h-5 w-5 text-red-600' />
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium truncate'>{file.name}</p>
        <p className='text-xs text-muted-foreground'>
          {(file.size / 1024).toFixed(0)} KB
        </p>
      </div>
      <div className='flex items-center gap-1 shrink-0'>
        <Button
          variant='ghost'
          size='sm'
          className='text-xs h-7'
          onClick={() => window.open(previewUrl, '_blank')}
        >
          <ExternalLink className='h-3.5 w-3.5 mr-1' />
          Ver
        </Button>
        {onReplace && (
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7'
            onClick={onReplace}
          >
            <ArrowDownUp className='h-3.5 w-3.5' />
          </Button>
        )}
      </div>
    </div>
  );
}

interface DocumentUploadStepProps {
  quantity: number;
  initialDocuments: File[];
  onDocumentsChange: (documents: File[]) => void;
  onBack: () => void;
  onPublish: () => void;
  isPublishing: boolean;
}

export function DocumentUploadStep({
  quantity,
  initialDocuments,
  onDocumentsChange,
  onBack,
  onPublish,
  isPublishing,
}: DocumentUploadStepProps) {
  const [fileSlots, setFileSlots] = useState<(File | null)[]>(() => {
    const slots = new Array<File | null>(quantity).fill(null);
    initialDocuments.forEach((doc, i) => {
      if (i < quantity) slots[i] = doc;
    });
    return slots;
  });
  const [currentIndex, setCurrentIndex] = useState(() => {
    // Start at first empty slot
    const firstEmpty = fileSlots.findIndex(f => f == null);
    return firstEmpty >= 0 ? firstEmpty : 0;
  });
  const [dropzoneKey, setDropzoneKey] = useState(0);

  const completedCount = fileSlots.filter(f => f != null).length;
  const allComplete = completedCount === quantity;
  const progressPercent = quantity > 0 ? (completedCount / quantity) * 100 : 0;
  const currentFile = fileSlots[currentIndex] ?? null;
  const isCurrentComplete = currentFile != null;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === quantity - 1;

  const syncToParent = useCallback(
    (slots: (File | null)[]) => {
      onDocumentsChange(slots.filter(Boolean) as File[]);
    },
    [onDocumentsChange],
  );

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && !isFirst) {
      setCurrentIndex(currentIndex - 1);
      setDropzoneKey(prev => prev + 1);
    } else if (direction === 'next' && !isLast) {
      setCurrentIndex(currentIndex + 1);
      setDropzoneKey(prev => prev + 1);
    }
  };

  const handleFileSelect = (file: File) => {
    const newSlots = [...fileSlots];
    newSlots[currentIndex] = file;
    setFileSlots(newSlots);
    syncToParent(newSlots);

    // Auto-advance to next incomplete ticket
    const nextIncomplete = newSlots.findIndex(
      (f, i) => i > currentIndex && f == null,
    );
    if (nextIncomplete >= 0) {
      setCurrentIndex(nextIncomplete);
      setDropzoneKey(prev => prev + 1);
    } else {
      // Try wrapping around
      const wrapIncomplete = newSlots.findIndex(f => f == null);
      if (wrapIncomplete >= 0 && wrapIncomplete !== currentIndex) {
        setCurrentIndex(wrapIncomplete);
        setDropzoneKey(prev => prev + 1);
      }
    }
  };

  const handleClear = () => {
    const newSlots = [...fileSlots];
    newSlots[currentIndex] = null;
    setFileSlots(newSlots);
    syncToParent(newSlots);
    setDropzoneKey(prev => prev + 1);
  };

  return (
    <div className='space-y-6'>
      {/* Back link */}
      <button
        type='button'
        onClick={onBack}
        className='flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors'
      >
        <ArrowLeft className='h-4 w-4' />
        Volver al formulario
      </button>

      {/* Header */}
      <div>
        <h2 className='text-xl font-bold'>
          Subí los documentos de tus entradas
        </h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Para publicar, necesitamos el QR o PDF de cada entrada. Podés sacarle
          una captura de pantalla o subir el archivo directo.
        </p>
      </div>

      {/* Progress section */}
      {quantity > 1 && (
        <div className='space-y-1.5'>
          <Progress value={progressPercent} className='h-1.5' />
          <p className='text-sm text-muted-foreground'>
            {completedCount} de {quantity} documento
            {quantity === 1 ? '' : 's'} listo{quantity === 1 ? '' : 's'}
          </p>
        </div>
      )}

      {/* Ticket card */}
      <div
        className={cn(
          'rounded-lg border p-4 transition-colors',
          isCurrentComplete
            ? 'border-green-500/30 bg-green-500/5'
            : 'border-orange-500/30 bg-orange-500/5',
        )}
      >
        <div className='flex items-center gap-3'>
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              isCurrentComplete
                ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                : 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
            )}
          >
            {isCurrentComplete ? (
              <CheckCircle2 className='h-5 w-5' />
            ) : (
              <Ticket className='h-5 w-5' />
            )}
          </div>
          <div className='flex-1 min-w-0'>
            <p className='font-semibold tabular-nums'>
              Entrada {currentIndex + 1} de {quantity}
            </p>
            <span
              className={cn(
                'text-xs font-medium',
                isCurrentComplete
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-orange-600 dark:text-orange-400',
              )}
            >
              {isCurrentComplete ? 'Documento agregado' : 'Pendiente'}
            </span>
          </div>
        </div>
      </div>

      {/* FileDropzone or preview state */}
      {isCurrentComplete && currentFile ? (
        <FilePreview file={currentFile} onReplace={handleClear} />
      ) : (
        <FileDropzone
          key={dropzoneKey}
          onFileSelect={handleFileSelect}
          selectedFile={currentFile}
          onClear={handleClear}
          accept={DOCUMENT_ACCEPTED_TYPES}
          acceptedMimeTypes={DOCUMENT_ACCEPTED_MIME_TYPES}
          maxFileSize={DOCUMENT_MAX_SIZE}
          title='Subí el QR o PDF de esta entrada'
          subtitle='PDF, PNG, JPG o HEIC (máx. 5MB)'
        />
      )}

      {/* Desktop navigation footer */}
      <div className='hidden md:flex items-center justify-between gap-3 pt-2'>
        {quantity > 1 ? (
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleNavigate('prev')}
              disabled={isFirst}
            >
              <ChevronLeft className='h-4 w-4 mr-1' />
              Anterior
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleNavigate('next')}
              disabled={isLast}
            >
              Siguiente
              <ChevronRight className='h-4 w-4 ml-1' />
            </Button>
          </div>
        ) : (
          <div />
        )}

        <Button
          onClick={onPublish}
          disabled={!allComplete || isPublishing}
        >
          {isPublishing ? (
            <>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2' />
              Publicando...
            </>
          ) : (
            'Publicar entradas'
          )}
        </Button>
      </div>

      {/* Desktop hint when not all complete */}
      {!allComplete && (
        <p className='hidden md:block text-sm text-muted-foreground text-center'>
          Tenés que subir todos los documentos antes de publicar
        </p>
      )}

      {/* Mobile sticky bottom bar */}
      <MobileDocumentBar
        currentIndex={currentIndex}
        quantity={quantity}
        completedCount={completedCount}
        isFirst={isFirst}
        isLast={isLast}
        allComplete={allComplete}
        isPublishing={isPublishing}
        onPrev={() => handleNavigate('prev')}
        onNext={() => handleNavigate('next')}
        onPublish={onPublish}
        onBack={onBack}
      />
    </div>
  );
}
