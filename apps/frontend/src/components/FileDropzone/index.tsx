import {useState, useRef, useId} from 'react';
import {Upload, FileText, AlertCircle, X} from 'lucide-react';
import {Button} from '~/components/ui/button';
import {Alert, AlertDescription} from '~/components/ui/alert';
import {cn} from '~/lib/utils';

export interface FileDropzoneProps {
  /** Callback when a file is selected */
  onFileSelect: (file: File) => void;
  /** Currently selected file */
  selectedFile?: File | null;
  /** Clear the selected file */
  onClear?: () => void;
  /** Accepted file types (e.g., '.pdf,.png,.jpg,.jpeg' or 'image/*') */
  accept?: string;
  /** Accepted MIME types for validation */
  acceptedMimeTypes?: string[];
  /** Max file size in bytes */
  maxFileSize?: number;
  /** Helper text shown below the dropzone title */
  helperText?: string;
  /** Title text for the dropzone */
  title?: string;
  /** Subtitle/hint text */
  subtitle?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Custom class name for the container */
  className?: string;
  /** Show a compact version */
  compact?: boolean;
  /** Custom display name for the selected file (overrides selectedFile.name) */
  displayFileName?: string;
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

export function FileDropzone({
  onFileSelect,
  selectedFile,
  onClear,
  accept = '.pdf,.png,.jpg,.jpeg',
  acceptedMimeTypes = DEFAULT_ACCEPTED_TYPES,
  maxFileSize = DEFAULT_MAX_SIZE,
  helperText,
  title = 'Arrastra tu archivo aquí o haz clic para seleccionar',
  subtitle,
  disabled = false,
  error,
  className,
  compact = false,
  displayFileName,
}: FileDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatMaxSize = () => {
    return formatFileSize(maxFileSize);
  };

  const validateFile = (file: File): string | null => {
    // Validate file type
    if (!acceptedMimeTypes.includes(file.type)) {
      const extensions = accept.split(',').join(', ');
      return `Solo se aceptan archivos ${extensions}`;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      return `El archivo debe ser menor a ${formatMaxSize()}`;
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationResult = validateFile(file);
    if (validationResult) {
      setValidationError(validationResult);
      return;
    }

    setValidationError(null);
    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

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

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClear?.();
  };

  const displayError = error || validationError;

  // Generate default subtitle based on accept and maxFileSize
  const defaultSubtitle = `${accept.replace(/\./g, '').toUpperCase().split(',').join(', ')} hasta ${formatMaxSize()}`;
  const finalSubtitle = subtitle ?? defaultSubtitle;

  return (
    <div className={cn('space-y-3', className)}>
      {helperText && (
        <Alert>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{helperText}</AlertDescription>
        </Alert>
      )}

      {/* Drop Zone */}
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-colors',
          dragActive && !disabled
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25',
          selectedFile && 'bg-muted/50',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          id={inputId}
          ref={fileInputRef}
          type='file'
          accept={accept}
          onChange={handleFileInputChange}
          className='hidden'
          disabled={disabled}
        />

        {!selectedFile ? (
          <div
            className={cn(
              'flex flex-col items-center justify-center text-center',
              compact ? 'p-4' : 'p-8',
            )}
          >
            <Upload
              className={cn(
                'text-muted-foreground',
                compact ? 'h-6 w-6 mb-2' : 'h-10 w-10 mb-4',
              )}
            />
            <p
              className={cn(
                'font-medium mb-1',
                compact ? 'text-xs' : 'text-sm',
              )}
            >
              {title}
            </p>
            <p
              className={cn(
                'text-muted-foreground',
                compact ? 'text-xs mb-2' : 'text-xs mb-4',
              )}
            >
              {finalSubtitle}
            </p>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              Seleccionar archivo
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              'flex items-center justify-between',
              compact ? 'p-3' : 'p-4',
            )}
          >
            <div className='flex items-center gap-3 min-w-0'>
              <div className='rounded-lg bg-primary/10 p-2 shrink-0'>
                <FileText
                  className={cn(
                    'text-primary',
                    compact ? 'h-4 w-4' : 'h-5 w-5',
                  )}
                />
              </div>
              <div className='min-w-0'>
                <p
                  className={cn(
                    'font-medium truncate',
                    compact ? 'text-xs' : 'text-sm',
                  )}
                >
                  {displayFileName ?? selectedFile.name}
                </p>
                <p
                  className={cn(
                    'text-muted-foreground',
                    compact ? 'text-xs' : 'text-xs',
                  )}
                >
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            {onClear && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={handleClear}
                disabled={disabled}
              >
                {compact ? <X className='h-4 w-4' /> : 'Cambiar'}
              </Button>
            )}
          </div>
        )}
      </div>

      {displayError && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default FileDropzone;
