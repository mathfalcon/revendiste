import {useState, useEffect} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from '@tanstack/react-router';
import axios from 'axios';
import {toast} from 'sonner';
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
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {Button} from '~/components/ui/button';
import {Badge} from '~/components/ui/badge';
import {Textarea} from '~/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {FileDropzone} from '~/components/FileDropzone';
import {
  getTicketReportDetailQuery,
  addUserActionMutation,
  closeCaseMutation,
  adminTicketReportDetailQueryOptions,
  addAdminActionMutation,
  uploadReportAttachmentMutation,
  uploadAdminReportAttachmentMutation,
} from '~/lib';
import {
  CASE_STATUS_LABELS,
  CASE_TYPE_LABELS,
  CASE_ACTION_TYPE_LABELS,
} from '@revendiste/shared';
import type {
  TicketReportStatus,
  TicketReportActionType,
} from '@revendiste/shared';
import {
  AlertTriangle,
  ArrowLeft,
  MessageSquare,
  FileImage,
  Film,
  ExternalLink,
  User,
  Shield,
  Send,
  XCircle,
  Ticket,
  Calendar,
  X,
  PenLine,
  DollarSign,
  Clock,
  CheckCircle2,
  ShoppingBag,
  MapPin,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface ReportDetailPageProps {
  reportId: string;
  isAdmin: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TicketReportStatus,
  {
    label: string;
    dotColor: string;
    textColor: string;
    bgColor: string;
  }
> = {
  awaiting_support: {
    label: CASE_STATUS_LABELS.awaiting_support,
    dotColor: 'bg-amber-400',
    textColor: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
  awaiting_customer: {
    label: CASE_STATUS_LABELS.awaiting_customer,
    dotColor: 'bg-blue-500',
    textColor: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  closed: {
    label: CASE_STATUS_LABELS.closed,
    dotColor: 'bg-muted-foreground/40',
    textColor: 'text-muted-foreground',
    bgColor: 'bg-muted/30',
  },
};

const ADMIN_ACTION_TYPES: {value: TicketReportActionType; label: string}[] = [
  {value: 'comment', label: 'Comentario'},
  {value: 'refund_partial', label: 'Reembolso parcial'},
  {value: 'refund_full', label: 'Reembolso completo'},
  {value: 'reject', label: 'Rechazar'},
  {value: 'close', label: 'Cerrar caso'},
];

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
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_FILES = 5;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('es-UY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('es-UY', {hour: '2-digit', minute: '2-digit'});
}

function FilePreviewRow({file, onRemove}: {file: File; onRemove: () => void}) {
  const isVideo = file.type.startsWith('video/');
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
      {isVideo ? (
        <Film className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      ) : (
        <FileImage className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      )}
      <span className="text-sm truncate flex-1 text-foreground/80">{file.name}</span>
      <span className="text-xs text-muted-foreground shrink-0">
        {formatFileSize(file.size)}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded p-0.5 hover:bg-muted transition-colors"
      >
        <X className="h-3 w-3 text-muted-foreground" />
      </button>
    </div>
  );
}

function AttachmentLink({att}: {att: any}) {
  const isImage = att.mimeType?.startsWith('image/');
  return (
    <a
      href={att.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border bg-background hover:bg-muted/50 transition-colors text-xs group"
    >
      {isImage ? (
        <FileImage className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
      ) : (
        <Film className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
      )}
      <span className="truncate flex-1 text-foreground/80">{att.originalName}</span>
      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/50" />
    </a>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function ReportDetailPage({reportId, isAdmin}: ReportDetailPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const detailQuery = isAdmin
    ? adminTicketReportDetailQueryOptions(reportId)
    : getTicketReportDetailQuery(reportId);

  const {data: reportDetail, isLoading, error: reportError} = useQuery(detailQuery);

  useEffect(() => {
    if (reportError && axios.isAxiosError(reportError)) {
      if (
        reportError.response?.status === 403 ||
        reportError.response?.status === 404
      ) {
        toast.error('No tenés permiso para ver este reporte');
        navigate({to: isAdmin ? '/admin/reportes' : '/cuenta/reportes'} as any);
      }
    }
  }, [reportError, navigate, isAdmin]);

  // ── Form state ─────────────────────────────────────────────────────────────

  const [comment, setComment] = useState('');
  const [actionType, setActionType] = useState<TicketReportActionType>('comment');
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const invalidateKeys = isAdmin
    ? ['admin', 'ticket-reports', reportId]
    : ['ticket-reports', reportId];

  const userActionMutation = useMutation({
    ...addUserActionMutation(reportId),
    onSuccess: () => queryClient.invalidateQueries({queryKey: invalidateKeys}),
  });

  const adminActionMutation = useMutation({
    ...addAdminActionMutation(reportId),
    onSuccess: () => queryClient.invalidateQueries({queryKey: invalidateKeys}),
  });

  const userCloseMutation = useMutation({
    ...closeCaseMutation(reportId),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['ticket-reports']}),
  });

  const actionMutation = isAdmin ? adminActionMutation : userActionMutation;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSubmitAction = async () => {
    const effectiveActionType = isAdmin ? actionType : 'comment';
    if (effectiveActionType === 'comment' && !comment.trim() && selectedFiles.length === 0) return;
    if (isAdmin && effectiveActionType !== 'comment' && !comment.trim()) {
      toast.error('Por favor agregá un comentario para esta acción.');
      return;
    }

    const actionResult = await actionMutation.mutateAsync({
      actionType: effectiveActionType,
      comment: comment.trim() || undefined,
    } as any);

    if (selectedFiles.length > 0) {
      setIsUploading(true);
      const actionId = actionResult.action.id;
      const uploadMut = isAdmin
        ? uploadAdminReportAttachmentMutation(reportId, actionId)
        : uploadReportAttachmentMutation(reportId, actionId);
      let failed = 0;
      for (const file of selectedFiles) {
        try {
          await uploadMut.mutationFn(file);
        } catch {
          failed++;
        }
      }
      setIsUploading(false);
      if (failed > 0) {
        toast.warning(
          `${failed} archivo${failed > 1 ? 's' : ''} no se pudo${failed > 1 ? 'ieron' : ''} subir.`,
        );
      }
    }

    queryClient.invalidateQueries({queryKey: invalidateKeys});
    setComment('');
    setActionType('comment');
    setSelectedFiles([]);
  };

  const handleCloseCase = () => {
    userCloseMutation.mutate();
    setShowCloseDialog(false);
  };

  const isPending =
    actionMutation.isPending || userCloseMutation.isPending || isUploading;

  // ── Loading state ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="py-8 animate-pulse space-y-4">
        <div className="h-6 bg-muted rounded w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <div className="space-y-3">
            <div className="h-48 bg-muted rounded-xl" />
            <div className="h-32 bg-muted rounded-xl" />
          </div>
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (!reportDetail) {
    return (
      <div className="py-8">
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Reporte no encontrado
          </CardContent>
        </Card>
      </div>
    );
  }

  const isClosed = reportDetail.status === 'closed';
  const actions = reportDetail.actions || [];
  const entityDetails = reportDetail.entityDetails;
  const initialAttachments = reportDetail.initialAttachments || [];
  const statusCfg = STATUS_CONFIG[reportDetail.status];
  const backTo = isAdmin ? '/admin/reportes' : '/cuenta/reportes';

  // Entity link — uses correct `orden` query param for /cuenta/tickets
  const entityLink = (() => {
    if (!entityDetails) return null;
    if ('orderId' in entityDetails && entityDetails.orderId) {
      return isAdmin
        ? `/admin/orders?orderId=${entityDetails.orderId}`
        : `/cuenta/tickets?orden=${entityDetails.orderId}`;
    }
    if ('listingId' in entityDetails && entityDetails.listingId) {
      return isAdmin
        ? `/admin/listings/${entityDetails.listingId}`
        : `/cuenta/ventas/${entityDetails.listingId}`;
    }
    return null;
  })();

  const headerTitle =
    entityDetails && 'eventName' in entityDetails && entityDetails.eventName
      ? entityDetails.eventName
      : CASE_TYPE_LABELS[reportDetail.caseType];

  return (
    <div className="space-y-4">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({to: backTo} as any)}
        className="-ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        {isAdmin ? 'Reportes' : 'Mis reportes'}
      </Button>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">

        {/* ── Left column: conversation + reply ── */}
        <div className="space-y-3 min-w-0">

          {/* Conversation card */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                Conversación
                {actions.length > 0 && (
                  <span className="ml-auto text-xs font-normal">
                    {actions.length} mensaje{actions.length !== 1 ? 's' : ''}
                  </span>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4">
              {/* Initial context: description + attachments */}
              {(reportDetail.description || initialAttachments.length > 0) && (
                <div className="mb-5 pb-5 border-b border-dashed">
                  {/* "Case opened" system row */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Caso abierto •{' '}
                      {formatDate(new Date(reportDetail.createdAt))}
                    </span>
                  </div>

                  {reportDetail.description && (
                    <div className="ml-8 px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-muted text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-2">
                      {reportDetail.description}
                    </div>
                  )}

                  {initialAttachments.length > 0 && (
                    <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {initialAttachments.map((att: any) => (
                        <AttachmentLink key={att.id} att={att} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Messages */}
              {actions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Aún no hay mensajes en este caso.
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {isAdmin
                      ? 'Respondé al cliente con un comentario o acción.'
                      : 'Cuando el soporte responda, lo verás aquí.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {actions.map((action: any) => {
                    const isActionAdmin =
                      action.performedByUserId !== reportDetail.reportedByUserId;
                    const isComment = action.actionType === 'comment';
                    const isOwnMessage = isAdmin === isActionAdmin;
                    const date = new Date(action.createdAt);
                    const senderLabel = isActionAdmin
                      ? 'Soporte'
                      : isAdmin
                        ? 'Cliente'
                        : 'Vos';

                    return (
                      <div
                        key={action.id}
                        className={`flex gap-2.5 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {/* Avatar */}
                        <div
                          className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center ${
                            isActionAdmin
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {isActionAdmin ? (
                            <Shield className="h-3.5 w-3.5" />
                          ) : (
                            <User className="h-3.5 w-3.5" />
                          )}
                        </div>

                        <div
                          className={`flex flex-col min-w-0 max-w-[78%] ${isOwnMessage ? 'items-end' : 'items-start'}`}
                        >
                          {/* Sender + time */}
                          <div
                            className={`flex items-baseline gap-1.5 mb-1 px-0.5 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                          >
                            <span className="text-xs font-medium text-foreground/80">
                              {senderLabel}
                            </span>
                            <span className="text-[11px] text-muted-foreground/60">
                              {formatDate(date)} {formatTime(date)}
                            </span>
                          </div>

                          {/* Action type tag (non-comment) */}
                          {!isComment && (
                            <div className="mb-1.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border bg-background text-muted-foreground">
                                {CASE_ACTION_TYPE_LABELS[
                                  action.actionType as TicketReportActionType
                                ] || action.actionType}
                              </span>
                            </div>
                          )}

                          {/* Bubble */}
                          {action.comment && (
                            <div
                              className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                isOwnMessage
                                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                  : 'bg-muted text-foreground rounded-tl-sm'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{action.comment}</p>
                            </div>
                          )}

                          {/* Attachments */}
                          {action.attachments && action.attachments.length > 0 && (
                            <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1 w-full">
                              {action.attachments.map((att: any) => (
                                <AttachmentLink key={att.id} att={att} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reply form */}
          {!isClosed ? (
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <PenLine className="h-4 w-4" />
                  {isAdmin ? 'Agregar acción' : 'Responder'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {isAdmin && (
                  <Select
                    value={actionType}
                    onValueChange={v => setActionType(v as TicketReportActionType)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ADMIN_ACTION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Textarea
                  placeholder={
                    isAdmin
                      ? 'Comentario (opcional para acciones, requerido para comentarios)…'
                      : 'Escribí tu mensaje…'
                  }
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  disabled={isPending}
                  className="resize-none text-sm"
                />

                {selectedFiles.length > 0 && (
                  <div className="space-y-1.5">
                    {selectedFiles.map((file, i) => (
                      <FilePreviewRow
                        key={`${file.name}-${file.size}`}
                        file={file}
                        onRemove={() =>
                          setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))
                        }
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
                    accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.mp4,.mov,.webm"
                    acceptedMimeTypes={ACCEPTED_MIME_TYPES}
                    maxFileSize={MAX_FILE_SIZE}
                    title="Agregar archivos"
                    subtitle="Imágenes o videos hasta 50 MB"
                  />
                )}

                <div className="flex items-center justify-between gap-2">
                  {!isAdmin ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCloseDialog(true)}
                      disabled={isPending}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Cerrar caso
                    </Button>
                  ) : (
                    <div />
                  )}
                  <Button
                    onClick={handleSubmitAction}
                    disabled={
                      isPending ||
                      ((!isAdmin || actionType === 'comment') &&
                        !comment.trim() &&
                        selectedFiles.length === 0)
                    }
                    size="sm"
                    className="gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {isPending ? 'Enviando…' : 'Enviar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground rounded-xl border bg-muted/20">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Caso cerrado — no se pueden agregar más mensajes.</span>
            </div>
          )}
        </div>

        {/* ── Right column: case info panel (sticky) ── */}
        <div className="lg:sticky lg:top-4 space-y-3">

          {/* Case header */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {/* Icon + title + status */}
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5 h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div className="min-w-0 flex-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="font-semibold text-sm leading-snug truncate cursor-default">
                          {headerTitle}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="start" className="max-w-xs">
                        <p>{headerTitle}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {CASE_TYPE_LABELS[reportDetail.caseType]}
                  </p>
                </div>
              </div>

              {/* Status pill */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-full justify-center ${statusCfg.bgColor} ${statusCfg.textColor}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotColor}`} />
                {statusCfg.label}
              </div>

              {/* Source badge (admin only) */}
              {isAdmin && reportDetail.source && (
                <div className="flex justify-center">
                  <Badge variant="outline" className="text-xs h-5 px-1.5 font-normal">
                    {reportDetail.source}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Entity details */}
          {entityDetails && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  {'orderId' in entityDetails ? (
                    <ShoppingBag className="h-3.5 w-3.5" />
                  ) : (
                    <Ticket className="h-3.5 w-3.5" />
                  )}
                  {'orderId' in entityDetails ? 'Orden' : 'Entrada'}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2.5">
                {'eventName' in entityDetails && entityDetails.eventName && (
                  <p className="font-medium text-sm leading-snug">
                    {entityDetails.eventName}
                  </p>
                )}

                <div className="space-y-1.5 text-sm">
                  {'ticketWaveName' in entityDetails && entityDetails.ticketWaveName && (
                    <div className="flex items-center gap-2">
                      <Ticket className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-foreground/80">{entityDetails.ticketWaveName}</span>
                    </div>
                  )}

                  {'eventStartDate' in entityDetails && entityDetails.eventStartDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-foreground/80">
                        {new Date(entityDetails.eventStartDate).toLocaleDateString('es-UY', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}

                  {(('price' in entityDetails && entityDetails.price) ||
                    ('totalAmount' in entityDetails && entityDetails.totalAmount)) &&
                    'currency' in entityDetails && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-foreground/80 font-medium">
                          {entityDetails.currency}{' '}
                          {'price' in entityDetails
                            ? entityDetails.price
                            : (entityDetails as any).totalAmount}
                        </span>
                      </div>
                    )}

                  {'reservationStatus' in entityDetails && entityDetails.reservationStatus && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-foreground/80">{entityDetails.reservationStatus}</span>
                    </div>
                  )}
                </div>

                {entityLink && (
                  <div className="pt-1">
                    <a
                      href={entityLink}
                      className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 rounded-lg border hover:border-foreground/20 hover:bg-muted/30"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver detalles
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Admin: reporter info */}
          {isAdmin && reportDetail.reportedByUserId && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Reportado por
                </p>
                <p className="text-xs font-mono text-foreground/70 break-all">
                  {reportDetail.reportedByUserId}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <div className="px-1 space-y-1 text-[11px] text-muted-foreground/60">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>Abierto {formatDate(new Date(reportDetail.createdAt))}</span>
            </div>
            {reportDetail.closedAt && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                <span>Cerrado {formatDate(new Date(reportDetail.closedAt))}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close confirmation (user only) */}
      {!isAdmin && (
        <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cerrar caso?</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que querés cerrar este caso? No podrás agregar
                más mensajes después de cerrarlo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCloseCase}>
                Cerrar caso
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
