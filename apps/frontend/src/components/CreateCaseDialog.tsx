import {useState, useCallback, useEffect, useRef} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {ANALYTICS_EVENTS, trackEvent} from '~/lib/analytics';
import {Link} from '@tanstack/react-router';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {Textarea} from '~/components/ui/textarea';
import {Label} from '~/components/ui/label';
import {Button} from '~/components/ui/button';
import {Alert, AlertDescription} from '~/components/ui/alert';
import {Ticket, X, FileImage, Film, AlertCircle, Plus} from 'lucide-react';
import {createCaseMutation, uploadReportAttachmentMutation} from '~/lib';
import type {StandardizedErrorResponse} from '~/lib/api';
import {CASE_TYPE_LABELS} from '@revendiste/shared';
import type {
  TicketReportCaseType,
  TicketReportEntityType,
} from '@revendiste/shared';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import {toast} from 'sonner';
import {TextEllipsis} from './ui/text-ellipsis';

interface CreateCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Always required — reports can only be created from a ticket or order
  prefillContext: {
    entityType: TicketReportEntityType;
    entityId: string;
    hasDocument?: boolean;
    /** Structured details shown line-by-line in the dialog */
    details?: {label: string; value: string}[];
  };

  // Optional callback after successful creation
  onSuccess?: (reportId: string) => void;
}

const ALL_USER_CASE_TYPES: {value: TicketReportCaseType; label: string}[] = [
  {value: 'invalid_ticket', label: CASE_TYPE_LABELS.invalid_ticket},
  {value: 'other', label: CASE_TYPE_LABELS.other},
];

const MAX_FILES = 5;
const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.heic,.heif,.mp4,.mov,.webm';
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Thumbnail chip for an attached file with preview. */
function FileThumbnail({file, onRemove}: {file: File; onRemove: () => void}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');

  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  return (
    <div className='relative shrink-0 pt-1.5 pr-1.5'>
      <div className='h-16 w-16 rounded-lg border bg-muted/30 overflow-hidden'>
        {isImage && previewUrl ? (
          <img
            src={previewUrl}
            alt={file.name}
            className='h-full w-full object-cover'
          />
        ) : (
          <div className='h-full w-full flex flex-col items-center justify-center gap-0.5'>
            {isVideo ? (
              <Film className='h-5 w-5 text-muted-foreground' />
            ) : (
              <FileImage className='h-5 w-5 text-muted-foreground' />
            )}
            <span className='text-[10px] text-muted-foreground px-1 truncate max-w-full'>
              {file.name.split('.').pop()?.toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <button
        type='button'
        onClick={onRemove}
        className='absolute top-0 right-0 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center touch-manipulation'
      >
        <X className='h-3 w-3' />
      </button>
    </div>
  );
}

/** Add-file button that matches thumbnail size. */
function AddFileButton({onClick}: {onClick: () => void}) {
  return (
    <div className='shrink-0 pt-1.5 pr-1.5'>
      <button
        type='button'
        onClick={onClick}
        className='h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30 flex flex-col items-center justify-center gap-0.5 transition-colors touch-manipulation cursor-pointer'
      >
        <Plus className='h-5 w-5 text-muted-foreground' />
        <span className='text-[10px] text-muted-foreground'>Agregar</span>
      </button>
    </div>
  );
}

export function CreateCaseDialog({
  open,
  onOpenChange,
  prefillContext,
  onSuccess,
}: CreateCaseDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [caseType, setCaseType] = useState<TicketReportCaseType>('other');
  const [description, setDescription] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [existingReportInfo, setExistingReportInfo] = useState<{
    reportId: string;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // "invalid_ticket" only available if the ticket has a document uploaded
  const availableCaseTypes =
    prefillContext.hasDocument === false
      ? ALL_USER_CASE_TYPES.filter(t => t.value !== 'invalid_ticket')
      : ALL_USER_CASE_TYPES;

  const createMutation = useMutation(createCaseMutation());

  const resetForm = useCallback(() => {
    setCaseType('other');
    setDescription('');
    setSelectedFiles([]);
    setIsSubmitting(false);
    setUploadStatus('');
    setExistingReportInfo(null);
    setFileError(null);
  }, []);

  const validateAndAddFiles = useCallback((files: File[]) => {
    setFileError(null);
    const valid: File[] = [];
    for (const file of files) {
      if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
        setFileError('Solo se aceptan imágenes o videos');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError('El archivo es demasiado grande (máx. 50 MB)');
        return;
      }
      valid.push(file);
    }
    setSelectedFiles(prev => [...prev, ...valid].slice(0, MAX_FILES));
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(Array.from(e.target.files));
    }
    // Reset so selecting the same file again works
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirm(false);

    try {
      setUploadStatus('Abriendo caso...');
      const result = await createMutation.mutateAsync({
        caseType,
        entityType: prefillContext.entityType,
        entityId: prefillContext.entityId,
        description: description || undefined,
      });

      if (selectedFiles.length > 0) {
        let uploaded = 0;
        let failed = 0;
        const mutation = uploadReportAttachmentMutation(result.id);

        for (const file of selectedFiles) {
          uploaded++;
          setUploadStatus(
            `Subiendo archivo ${uploaded} de ${selectedFiles.length}...`,
          );
          try {
            await mutation.mutationFn(file);
          } catch {
            failed++;
          }
        }

        if (failed > 0) {
          toast.warning(
            `Caso creado, pero ${failed} archivo${failed > 1 ? 's' : ''} no se pudo${failed > 1 ? 'ieron' : ''} subir.`,
          );
        }
      }

      trackEvent(ANALYTICS_EVENTS.SUPPORT_CASE_CREATED, {
        case_type: caseType,
        entity_type: prefillContext.entityType,
        has_attachments: selectedFiles.length > 0,
        attachment_count: selectedFiles.length,
      });
      resetForm();
      onOpenChange(false);
      queryClient.invalidateQueries({queryKey: ['ticket-reports']});
      onSuccess?.(result.id);
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const errorData = err.response?.data as StandardizedErrorResponse;
        const existingReportId = errorData?.metadata?.existingReportId;
        if (existingReportId && typeof existingReportId === 'string') {
          setExistingReportInfo({reportId: existingReportId});
        }
      }
      setIsSubmitting(false);
      setUploadStatus('');
    }
  };

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) setExistingReportInfo(null);
      onOpenChange(newOpen);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[500px] max-h-[calc(100dvh-2rem)] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Reportar un problema</DialogTitle>
        </DialogHeader>

        <div className='space-y-4 pt-2'>
          {existingReportInfo && (
            <Alert className='bg-yellow-500/10 border-yellow-500/30'>
              <AlertCircle className='h-4 w-4 text-yellow-600' />
              <AlertDescription>
                Ya tenés un caso abierto para esta entrada.{' '}
                <Link
                  to='/cuenta/reportes/$reportId'
                  params={{reportId: existingReportInfo.reportId}}
                  className='underline font-medium'
                >
                  Ver caso
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* Pre-filled context summary */}
          {prefillContext.details && prefillContext.details.length > 0 && (
            <div className='rounded-lg border bg-muted/30 p-3 space-y-1.5'>
              <div className='flex items-center gap-2 text-sm font-medium'>
                <Ticket className='h-4 w-4 text-muted-foreground' />
                Entrada a reportar
              </div>
              {prefillContext.details.map((detail, i) => (
                <div key={i} className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>{detail.label}</span>
                  <TextEllipsis
                    maxLines={1}
                    className='font-medium text-right max-w-[50%]'
                  >
                    {detail.value}
                  </TextEllipsis>
                </div>
              ))}
            </div>
          )}

          {/* Case type selector */}
          <div>
            <Label>Motivo</Label>
            <Select
              value={caseType}
              onValueChange={v => setCaseType(v as TicketReportCaseType)}
            >
              <SelectTrigger className='mt-1'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCaseTypes.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label>Descripción (opcional)</Label>
            <Textarea
              className='mt-1'
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder='Contanos más sobre el problema...'
              rows={3}
            />
          </div>

          {/* Attachments — thumbnail grid */}
          <div>
            <Label>Adjuntos (opcional)</Label>
            <p className='text-xs text-muted-foreground mt-0.5 mb-2'>
              Imágenes o videos. Máx. {MAX_FILES} archivos, 50 MB c/u.
            </p>

            <input
              ref={fileInputRef}
              type='file'
              accept={ACCEPTED_EXTENSIONS}
              multiple
              onChange={handleFileInputChange}
              className='hidden'
            />

            <div className='flex gap-2 overflow-x-auto pb-1'>
              {selectedFiles.map((file, i) => (
                <FileThumbnail
                  key={`${file.name}-${file.size}-${i}`}
                  file={file}
                  onRemove={() =>
                    setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))
                  }
                />
              ))}
              {selectedFiles.length < MAX_FILES && (
                <AddFileButton onClick={() => fileInputRef.current?.click()} />
              )}
            </div>

            {fileError && (
              <p className='text-xs text-destructive mt-1.5'>{fileError}</p>
            )}
          </div>

          <Button
            className='w-full'
            disabled={!caseType || isSubmitting}
            onClick={() => setShowConfirm(true)}
          >
            {isSubmitting ? uploadStatus : 'Abrir caso'}
          </Button>
        </div>
      </DialogContent>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar reporte?</AlertDialogTitle>
            <AlertDialogDescription>
              Se abrirá un caso y nuestro equipo lo va a revisar. Te avisamos
              cuando haya novedades.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
