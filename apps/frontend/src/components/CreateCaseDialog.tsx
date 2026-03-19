import {useState, useCallback} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
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
import {Ticket, X, FileImage, Film, AlertCircle} from 'lucide-react';
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
import {FileDropzone} from '~/components/FileDropzone';
import {toast} from 'sonner';
import {TextEllipsis} from './ui/text-ellipsis';

interface CreateCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Optional pre-filled context - when provided, hides UUID input
  prefillContext?: {
    entityType: TicketReportEntityType;
    entityId: string;
    hasDocument?: boolean;
    /** Structured details shown line-by-line in the dialog */
    details?: {label: string; value: string}[];
  };

  // Optional callback after successful creation
  onSuccess?: (reportId: string) => void;
}

const ENTITY_TYPE_LABELS: Record<TicketReportEntityType, string> = {
  order: 'Una orden completa',
  order_ticket_reservation: 'Una entrada específica',
  listing: 'Una publicación',
  listing_ticket: 'Un ticket publicado',
};

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
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB (videos); images validated at 10 MB in backend

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

function FilePreviewRow({file, onRemove}: {file: File; onRemove: () => void}) {
  const isVideo = file.type.startsWith('video/');
  return (
    <div className='flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2'>
      {isVideo ? (
        <Film className='h-4 w-4 shrink-0 text-muted-foreground' />
      ) : (
        <FileImage className='h-4 w-4 shrink-0 text-muted-foreground' />
      )}
      <span className='text-sm truncate flex-1'>{file.name}</span>
      <span className='text-xs text-muted-foreground shrink-0'>
        {formatFileSize(file.size)}
      </span>
      <button
        type='button'
        onClick={onRemove}
        className='shrink-0 rounded-sm p-0.5 hover:bg-muted'
      >
        <X className='h-3.5 w-3.5 text-muted-foreground' />
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

  // Form state
  const [caseType, setCaseType] = useState<TicketReportCaseType>('other');
  const [entityType, setEntityType] = useState<TicketReportEntityType>('order');
  const [entityId, setEntityId] = useState('');
  const [description, setDescription] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // Attachment state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [existingReportInfo, setExistingReportInfo] = useState<{reportId: string} | null>(null);

  // "invalid_ticket" only available if the ticket has a document uploaded
  const availableCaseTypes =
    prefillContext?.hasDocument === false
      ? ALL_USER_CASE_TYPES.filter(t => t.value !== 'invalid_ticket')
      : ALL_USER_CASE_TYPES;

  const createMutation = useMutation(createCaseMutation());

  const resetForm = useCallback(() => {
    setCaseType('other');
    setEntityType('order');
    setEntityId('');
    setDescription('');
    setSelectedFiles([]);
    setIsSubmitting(false);
    setUploadStatus('');
    setExistingReportInfo(null);
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirm(false);

    try {
      // Step 1: Create the case
      setUploadStatus('Abriendo caso...');
      const submitData = {
        caseType,
        entityType: prefillContext?.entityType ?? entityType,
        entityId: prefillContext?.entityId ?? entityId,
        description: description || undefined,
      };
      const result = await createMutation.mutateAsync(submitData);

      // Step 2: Upload attachments (if any)
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

      // Success
      resetForm();
      onOpenChange(false);
      queryClient.invalidateQueries({queryKey: ['ticket-reports']});
      onSuccess?.(result.id);
    } catch (err: any) {
      // Detect 409 conflict (duplicate report) and extract existing report ID
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

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Determine if we can submit
  const canSubmit = prefillContext
    ? !!caseType // Only need case type when prefilled
    : !!caseType && !!entityId; // Need both when manual entry

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      // Clear existingReportInfo when closing
      setExistingReportInfo(null);
    }
    onOpenChange(newOpen);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Reportar un problema</DialogTitle>
        </DialogHeader>

        <div className='space-y-4 pt-2'>
          {existingReportInfo && (
            <Alert className="bg-yellow-500/10 border-yellow-500/30">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                Ya existe un caso abierto para esta entidad.{' '}
                <Link
                  to="/cuenta/reportes/$reportId"
                  params={{reportId: existingReportInfo.reportId}}
                  className="underline font-medium"
                >
                  Ver reporte
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {prefillContext ? (
            // Pre-filled mode: show structured summary
            <>
              {prefillContext.details && prefillContext.details.length > 0 && (
                <div className='rounded-lg border bg-muted/30 p-3 space-y-1.5'>
                  <div className='flex items-center gap-2 text-sm font-medium'>
                    <Ticket className='h-4 w-4 text-muted-foreground' />
                    Entrada a reportar
                  </div>
                  {prefillContext.details.map((detail, i) => (
                    <div key={i} className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>
                        {detail.label}
                      </span>
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
              <div className='border-b' />
            </>
          ) : (
            // Manual mode: show entity type selector and UUID input
            <>
              <div>
                <Label>¿Qué querés reportar?</Label>
                <Select
                  value={entityType}
                  onValueChange={v =>
                    setEntityType(v as TicketReportEntityType)
                  }
                >
                  <SelectTrigger className='mt-1'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(
                        ENTITY_TYPE_LABELS,
                      ) as TicketReportEntityType[]
                    ).map(type => (
                      <SelectItem key={type} value={type}>
                        {ENTITY_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>ID de la orden o entrada</Label>
                <input
                  type='text'
                  className='mt-1 w-full border rounded px-3 py-2 text-sm'
                  value={entityId}
                  onChange={e => setEntityId(e.target.value)}
                  placeholder='UUID de la orden o entrada...'
                />
              </div>
            </>
          )}

          {/* Case type selector - always shown */}
          <div>
            <Label>Motivo del reporte</Label>
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

          {/* Description - always shown */}
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

          {/* Attachments */}
          <div>
            <Label>Adjuntos (opcional)</Label>
            <p className='text-xs text-muted-foreground mt-0.5 mb-2'>
              Imágenes o videos como prueba del problema. Máx. {MAX_FILES}{' '}
              archivos.
            </p>

            {selectedFiles.length > 0 && (
              <div className='space-y-1.5 mb-2'>
                {selectedFiles.map((file, i) => (
                  <FilePreviewRow
                    key={`${file.name}-${file.size}`}
                    file={file}
                    onRemove={() => removeFile(i)}
                  />
                ))}
              </div>
            )}

            {selectedFiles.length < MAX_FILES && (
              <FileDropzone
                compact
                multiple
                onFileSelect={file => setSelectedFiles(prev => [...prev, file])}
                onFilesSelect={files =>
                  setSelectedFiles(prev => [...prev, ...files].slice(0, MAX_FILES))
                }
                accept='.jpg,.jpeg,.png,.webp,.heic,.heif,.mp4,.mov,.webm'
                acceptedMimeTypes={ACCEPTED_MIME_TYPES}
                maxFileSize={MAX_FILE_SIZE}
                title='Agregar archivos'
                subtitle='Imágenes (10 MB) o videos (50 MB)'
              />
            )}
          </div>

          {/* Submit button */}
          <Button
            className='w-full'
            disabled={!canSubmit || isSubmitting}
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
              Se abrirá un caso y nuestro equipo de soporte lo revisará. Te
              notificaremos cuando haya novedades.
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
