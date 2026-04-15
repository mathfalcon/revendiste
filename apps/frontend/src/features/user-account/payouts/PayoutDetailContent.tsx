import {useState, useMemo, type ReactNode} from 'react';
import {isSameDay} from 'date-fns';
import {Link} from '@tanstack/react-router';
import {Badge} from '~/components/ui/badge';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {Button} from '~/components/ui/button';
import {formatCurrency, formatEventDate, formatSmartDateTime} from '~/utils';
import {
  CheckCircle,
  CheckCircle2,
  Circle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  ExternalLink,
  FileImage,
  FileText,
  Wallet,
  Landmark,
  Mail,
  Ban,
  Calendar,
  MapPin,
} from 'lucide-react';
import {formatFileSize} from '~/utils/file-icons';
import type {GetUserPayoutDetailsResponse} from '~/lib/api/generated';
import {
  PayoutEventType,
  PayoutStatus,
  PayoutType,
} from '~/lib/api/generated';
import {cn} from '~/lib/utils';

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return (
        <Badge
          variant='outline'
          className='border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
        >
          <Clock className='h-3 w-3 mr-1' aria-hidden />
          Pendiente
        </Badge>
      );
    case 'processing':
      return (
        <Badge
          variant='outline'
          className='border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400'
        >
          <AlertCircle className='h-3 w-3 mr-1' aria-hidden />
          En proceso
        </Badge>
      );
    case 'completed':
      return (
        <Badge
          variant='outline'
          className='border-green-500 bg-green-500/10 text-green-700 dark:text-green-400'
        >
          <CheckCircle className='h-3 w-3 mr-1' aria-hidden />
          Listo
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant='destructive'>
          <XCircle className='h-3 w-3 mr-1' aria-hidden />
          Falló
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant='outline' className='border-gray-500 bg-gray-500/10'>
          <XCircle className='h-3 w-3 mr-1' aria-hidden />
          Cancelado
        </Badge>
      );
    default:
      return <Badge variant='outline'>{status}</Badge>;
  }
}

function getEventTypeLabel(eventType: string) {
  switch (eventType) {
    case 'payout_requested':
      return 'Pediste el retiro';
    case 'admin_processed':
      return 'Lo procesamos';
    case 'transfer_initiated':
      return 'Transferencia iniciada';
    case 'transfer_completed':
      return 'Retiro listo';
    case 'transfer_failed':
      return 'No se pudo transferir';
    case 'cancelled':
      return 'Cancelado';
    case 'status_change':
      return 'Cambió el estado';
    default:
      return eventType;
  }
}

/** Maps audit events to the 3-step seller workflow (solicitud → revisión → envío). */
function payoutEventWorkflowStep(
  event: GetUserPayoutDetailsResponse['events'][number],
): 0 | 1 | 2 | null {
  switch (event.eventType) {
    case PayoutEventType.PayoutRequested:
      return 0;
    case PayoutEventType.AdminProcessed:
      return 1;
    case PayoutEventType.StatusChange: {
      const to = event.toStatus;
      if (to === PayoutStatus.Processing) return 1;
      if (to === PayoutStatus.Completed || to === PayoutStatus.Failed) {
        return 2;
      }
      if (to === PayoutStatus.Cancelled) return 1;
      if (to === PayoutStatus.Pending) return 0;
      return null;
    }
    case PayoutEventType.TransferInitiated:
    case PayoutEventType.TransferCompleted:
    case PayoutEventType.TransferFailed:
      return 2;
    case PayoutEventType.Cancelled:
      return 1;
    default:
      return null;
  }
}

/** Fixed journey shown in Actividad; phases derived from payout.status (3 steps: solicitud → revisión → envío/acreditación) */
const PAYOUT_FLOW_DEFINITIONS = [
  {
    id: 'requested',
    title: 'Pediste el retiro',
    description:
      'Registramos tu solicitud y el monto que elegiste retirar.',
  },
  {
    id: 'review',
    title: 'Revisamos tu solicitud',
    description:
      'Verificamos tu método de cobro y los datos antes de enviarte el dinero.',
  },
  {
    id: 'delivery',
    title: 'Transferencia del retiro',
    description:
      'Enviamos el monto al método que seleccionaste. Tu banco o PayPal pueden tardar en reflejarlo en tu cuenta.',
  },
] as const;

type FlowPhase = 'complete' | 'current' | 'upcoming' | 'error' | 'cancelled';

function getPayoutFlowPhases(
  status: GetUserPayoutDetailsResponse['status'],
): FlowPhase[] {
  switch (status) {
    case 'pending':
      return ['complete', 'current', 'upcoming'];
    case 'processing':
      return ['complete', 'complete', 'current'];
    case 'completed':
      return ['complete', 'complete', 'complete'];
    case 'failed':
      return ['complete', 'complete', 'error'];
    case 'cancelled':
      return ['complete', 'cancelled', 'upcoming'];
    default:
      return ['current', 'upcoming', 'upcoming'];
  }
}

function getDeliveryStepDescription(phase: FlowPhase): string {
  switch (phase) {
    case 'upcoming':
      return 'Cuando finalice la revisión, enviamos el dinero al método que seleccionaste.';
    case 'current':
      return 'Estamos procesando el envío al método que elegiste. Puede demorar en verse según tu banco o PayPal.';
    case 'complete':
      return 'El envío se completó. Puede tardar en aparecer en el extracto según tu entidad.';
    default:
      return PAYOUT_FLOW_DEFINITIONS[2].description;
  }
}

function FlowStepMarker({phase}: {phase: FlowPhase}) {
  const base =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200';

  switch (phase) {
    case 'complete':
      return (
        <span
          className={cn(
            base,
            'border-primary bg-primary text-primary-foreground',
          )}
          aria-hidden
        >
          <CheckCircle2 className='h-4 w-4' strokeWidth={2.5} />
        </span>
      );
    case 'current':
      return (
        <span
          className={cn(
            base,
            'border-primary bg-background text-primary shadow-sm ring-2 ring-primary/20',
          )}
          aria-hidden
        >
          <span className='h-2.5 w-2.5 rounded-full bg-primary' />
        </span>
      );
    case 'upcoming':
      return (
        <span
          className={cn(
            base,
            'border-muted-foreground/20 bg-muted/40 text-muted-foreground/35',
          )}
          aria-hidden
        >
          <Circle className='h-3.5 w-3.5' strokeWidth={1.5} />
        </span>
      );
    case 'error':
      return (
        <span
          className={cn(
            base,
            'border-destructive bg-destructive/10 text-destructive',
          )}
          aria-hidden
        >
          <XCircle className='h-4 w-4' strokeWidth={2.5} />
        </span>
      );
    case 'cancelled':
      return (
        <span
          className={cn(
            base,
            'border-destructive/55 bg-destructive/12 text-destructive',
          )}
          aria-hidden
        >
          <Ban className='h-4 w-4' strokeWidth={2.5} />
        </span>
      );
    default:
      return null;
  }
}

const payoutSectionHeaderClass =
  'flex flex-col gap-1 space-y-0 p-0 px-4 py-3 border-b bg-muted/20';

type LinkedEarningRow =
  NonNullable<GetUserPayoutDetailsResponse['linkedEarnings']>[number];

function LinkedEarningsSection({
  linkedEarnings,
}: {
  linkedEarnings: NonNullable<GetUserPayoutDetailsResponse['linkedEarnings']>;
}) {
  const byListing = useMemo(() => {
    const m = new Map<string, LinkedEarningRow[]>();
    for (const e of linkedEarnings) {
      const key = e.listingId;
      const arr = m.get(key) ?? [];
      arr.push(e);
      m.set(key, arr);
    }
    return [...m.entries()];
  }, [linkedEarnings]);

  return (
    <Card>
      <CardHeader className={payoutSectionHeaderClass}>
        <CardTitle className='text-sm font-medium leading-snug text-muted-foreground'>
          Entradas de este retiro
        </CardTitle>
        <p className='text-xs text-muted-foreground leading-relaxed'>
          Montos por entrada vendida. Podés abrir la publicación en Mis
          publicaciones.
        </p>
      </CardHeader>
      <CardContent className='p-4 space-y-3'>
        {byListing.map(([listingId, earnings]) => {
          const meta = earnings[0]!;
          const start = new Date(meta.eventStartDate);
          const end = new Date(meta.eventEndDate);
          const eventDateLabel = isSameDay(start, end)
            ? formatEventDate(start)
            : `${formatEventDate(start)} – ${formatEventDate(end)}`;

          return (
          <div
            key={listingId}
            className='rounded-lg border bg-muted/15 px-3 py-3 space-y-3'
          >
            <div className='flex flex-wrap items-start justify-between gap-3 gap-y-2 border-b border-border/40 pb-3'>
              <div className='min-w-0 space-y-1.5 flex-1'>
                {meta.eventSlug ? (
                  <Link
                    to='/eventos/$slug'
                    params={{slug: meta.eventSlug}}
                    preloadDelay={0}
                    className='text-sm font-semibold leading-snug hover:text-primary hover:underline block'
                  >
                    {meta.eventName}
                  </Link>
                ) : (
                  <p className='text-sm font-semibold leading-snug'>
                    {meta.eventName}
                  </p>
                )}
                <p className='text-xs text-muted-foreground'>
                  {meta.ticketWaveName}
                </p>
                <div className='flex flex-col gap-1 text-xs text-muted-foreground pt-0.5'>
                  <span className='inline-flex items-start gap-1.5'>
                    <Calendar
                      className='h-3.5 w-3.5 shrink-0 mt-0.5'
                      aria-hidden
                    />
                    <span>{eventDateLabel}</span>
                  </span>
                  {meta.venueName ? (
                    <span className='inline-flex items-start gap-1.5'>
                      <MapPin
                        className='h-3.5 w-3.5 shrink-0 mt-0.5'
                        aria-hidden
                      />
                      <span className='line-clamp-2'>{meta.venueName}</span>
                    </span>
                  ) : null}
                </div>
              </div>
              <Link
                to='/cuenta/publicaciones/$listingId'
                params={{listingId}}
                className='text-xs font-medium text-primary inline-flex items-center gap-1 hover:underline shrink-0'
              >
                Ir a la publicación
                <ExternalLink className='h-3 w-3' aria-hidden />
              </Link>
            </div>
            <p className='text-xs text-muted-foreground'>
              {earnings.length === 1
                ? 'Una entrada vendida en esta publicación'
                : `${earnings.length} entradas vendidas en esta publicación`}
            </p>
            <ul className='space-y-0'>
              {earnings.map(earning => (
                <li
                  key={earning.id}
                  className='flex justify-between items-center gap-2 text-sm py-2 border-b border-border/50 last:border-0 last:pb-0 first:pt-0'
                >
                  <span className='text-muted-foreground truncate min-w-0'>
                    Ref. entrada{' '}
                    <span className='font-mono text-xs'>
                      {earning.listingTicketId.slice(0, 8)}…
                    </span>
                  </span>
                  <span className='font-medium tabular-nums shrink-0'>
                    {formatCurrency(earning.sellerAmount, earning.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function PayoutStepMovementLines({
  stepIndex,
  events: stepEvents,
  payout,
  phase,
}: {
  stepIndex: 0 | 1 | 2;
  events: GetUserPayoutDetailsResponse['events'];
  payout: GetUserPayoutDetailsResponse;
  phase: FlowPhase;
}) {
  const showRequestedFallback =
    stepIndex === 0 &&
    stepEvents.length === 0 &&
    Boolean(payout.requestedAt);

  if (stepEvents.length === 0 && !showRequestedFallback) {
    return null;
  }

  return (
    <ul
      className={cn(
        'mt-2.5 space-y-1.5',
        phase === 'upcoming' && 'text-muted-foreground/45',
      )}
      aria-label='Movimientos registrados en este paso'
    >
      {stepEvents.map(event => (
        <li
          key={event.id}
          className='flex flex-wrap items-baseline gap-x-1.5 gap-y-0 text-[11px] text-muted-foreground'
        >
          <span className='font-medium text-foreground/85'>
            {getEventTypeLabel(event.eventType)}
          </span>
          <span aria-hidden>·</span>
          <time dateTime={event.createdAt} className='tabular-nums'>
            {formatSmartDateTime(event.createdAt)}
          </time>
        </li>
      ))}
      {showRequestedFallback ? (
        <li className='flex flex-wrap items-baseline gap-x-1.5 gap-y-0 text-[11px] text-muted-foreground'>
          <span className='font-medium text-foreground/85'>
            Solicitud registrada
          </span>
          <span aria-hidden>·</span>
          <time dateTime={payout.requestedAt} className='tabular-nums'>
            {formatSmartDateTime(payout.requestedAt)}
          </time>
        </li>
      ) : null}
    </ul>
  );
}

function PayoutActivitySection({
  payout,
}: {
  payout: GetUserPayoutDetailsResponse;
}) {
  const phases = getPayoutFlowPhases(payout.status);
  const events = payout.events ?? [];
  const eventsByStep = useMemo(() => {
    const buckets: [
      GetUserPayoutDetailsResponse['events'],
      GetUserPayoutDetailsResponse['events'],
      GetUserPayoutDetailsResponse['events'],
    ] = [[], [], []];
    for (const e of events) {
      const step = payoutEventWorkflowStep(e);
      if (step === null) continue;
      buckets[step].push(e);
    }
    for (const b of buckets) {
      b.sort(
        (a, c) =>
          new Date(a.createdAt).getTime() - new Date(c.createdAt).getTime(),
      );
    }
    return buckets;
  }, [events]);
  const failureReason = payout.failureReason?.trim();
  const balanceHint =
    payout.status === 'failed' || payout.status === 'cancelled' ? (
      <p className='text-xs mt-3 pt-3 border-t border-destructive/25 text-muted-foreground'>
        Tu saldo sigue disponible: podés solicitar otro retiro cuando quieras.
        Si tenés dudas, podés contactarnos desde tu cuenta.
      </p>
    ) : null;

  return (
    <Card>
      <CardHeader className={payoutSectionHeaderClass}>
        <CardTitle className='text-sm font-medium leading-snug text-muted-foreground'>
          Cómo va tu retiro
        </CardTitle>
        <p className='text-xs text-muted-foreground leading-relaxed'>
          Las etapas pendientes se muestran atenuadas hasta que el proceso avance.
        </p>
      </CardHeader>
      <CardContent className='p-4'>
        <ol
          className='relative space-y-0'
          aria-label='Pasos del retiro'
        >
          {PAYOUT_FLOW_DEFINITIONS.map((step, index) => {
            const stepIndex = index as 0 | 1 | 2;
            const phase = phases[index]!;
            const isLast = index === PAYOUT_FLOW_DEFINITIONS.length - 1;
            const isDeliveryStep = step.id === 'delivery';

            const title =
              phase === 'cancelled' && index === 1
                ? 'Retiro cancelado'
                : phase === 'error' && isDeliveryStep
                  ? 'No pudimos completar la transferencia'
                  : step.title;

            let description: ReactNode;
            if (phase === 'cancelled' && index === 1) {
              description = (
                <>
                  {failureReason ? (
                    <span className='whitespace-pre-wrap block'>
                      <span className='font-medium'>Razón: </span>
                      {failureReason}
                    </span>
                  ) : (
                    'Este retiro fue cancelado. Si tenías saldo retenido, ya está disponible en tu balance.'
                  )}
                  {balanceHint}
                </>
              );
            } else if (phase === 'error' && isDeliveryStep) {
              description = (
                <>
                  <span className='block'>
                    No se pudo completar el envío al método que elegiste.
                  </span>
                  {failureReason ? (
                    <span className='whitespace-pre-wrap block mt-2'>
                      <span className='font-medium'>Razón: </span>
                      {failureReason}
                    </span>
                  ) : null}
                  {balanceHint}
                </>
              );
            } else if (isDeliveryStep) {
              description = getDeliveryStepDescription(phase);
            } else {
              description = step.description;
            }

            const isUpcoming = phase === 'upcoming';
            const isCurrent = phase === 'current';
            const isNegativeStep = phase === 'error' || phase === 'cancelled';

            return (
              <li
                key={step.id}
                className={cn(
                  'relative flex gap-3 rounded-lg py-2 pl-2 pr-2 -mx-1',
                  !isLast && 'mb-2',
                  isNegativeStep &&
                    'border border-destructive/30 bg-destructive/8 dark:bg-destructive/15',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div className='relative flex w-8 shrink-0 justify-center pt-0.5'>
                  {!isLast && (
                    <div
                      className={cn(
                        'absolute top-8.5 bottom-0 left-1/2 w-px -translate-x-1/2',
                        phase === 'complete'
                          ? 'bg-primary/35'
                          : 'bg-border',
                      )}
                      aria-hidden
                    />
                  )}
                  <div className='relative z-10'>
                    <FlowStepMarker phase={phase} />
                  </div>
                </div>
                <div
                  className={cn(
                    'min-w-0 flex-1 pt-0.5',
                    isLast ? 'pb-1' : 'pb-9',
                  )}
                >
                  <div className='flex flex-wrap items-center gap-x-2 gap-y-0.5'>
                    <h3
                      className={cn(
                        'text-sm font-semibold',
                        isUpcoming && 'text-muted-foreground/55',
                        phase === 'error' && 'text-destructive',
                        phase === 'cancelled' &&
                          index === 1 &&
                          'text-destructive',
                      )}
                    >
                      {title}
                    </h3>
                  </div>
                  <div
                    className={cn(
                      'text-xs mt-1.5 leading-relaxed',
                      isUpcoming && !isNegativeStep
                        ? 'text-muted-foreground/45'
                        : 'text-muted-foreground',
                      phase === 'error' && 'text-destructive/90',
                      phase === 'cancelled' &&
                        index === 1 &&
                        'text-destructive/85',
                    )}
                  >
                    {description}
                  </div>
                  <PayoutStepMovementLines
                    stepIndex={stepIndex}
                    events={eventsByStep[stepIndex]}
                    payout={payout}
                    phase={phase}
                  />
                  {isCurrent && (
                    <p className='text-[11px] font-medium text-primary mt-2.5'>
                      En curso
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

function documentTypeLabel(documentType: string) {
  switch (documentType) {
    case 'voucher':
      return 'Comprobante del retiro';
    default:
      return 'Archivo';
  }
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return (
    <div className='flex justify-between gap-3 text-sm'>
      <span className='text-muted-foreground shrink-0'>{label}</span>
      <span className='text-right min-w-0 wrap-break-word'>{value}</span>
    </div>
  );
}

type DocPreview = {
  url: string;
  name: string;
  mimeType: string;
};

function PayoutDocumentBlock({
  doc,
  onPreview,
}: {
  doc: GetUserPayoutDetailsResponse['documents'][number];
  onPreview: (p: DocPreview) => void;
}) {
  const isImage = doc.mimeType?.toLowerCase().startsWith('image/');
  const isPdf = doc.mimeType?.toLowerCase() === 'application/pdf';
  const typeLabel = documentTypeLabel(doc.documentType);

  return (
    <div className='rounded-lg border bg-background overflow-hidden'>
      {isImage ? (
        <button
          type='button'
          onClick={() =>
            onPreview({
              url: doc.url,
              name: doc.originalName,
              mimeType: doc.mimeType,
            })
          }
          className='block w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
          aria-label={`Ampliar imagen: ${doc.originalName}`}
        >
          <img
            src={doc.url}
            alt={`${typeLabel}: ${doc.originalName}`}
            className='w-full max-h-52 object-contain bg-muted/40'
            loading='lazy'
          />
        </button>
      ) : null}
      <div className='p-3 space-y-2'>
        <div className='flex items-start gap-2 min-w-0'>
          {isPdf ? (
            <FileText
              className='h-4 w-4 shrink-0 text-muted-foreground mt-0.5'
              aria-hidden
            />
          ) : isImage ? (
            <FileImage
              className='h-4 w-4 shrink-0 text-muted-foreground mt-0.5'
              aria-hidden
            />
          ) : (
            <FileText
              className='h-4 w-4 shrink-0 text-muted-foreground mt-0.5'
              aria-hidden
            />
          )}
          <div className='min-w-0 flex-1'>
            <p className='text-xs font-medium text-muted-foreground'>
              {typeLabel}
            </p>
            <p className='text-sm font-medium truncate' title={doc.originalName}>
              {doc.originalName}
            </p>
            <p className='text-xs text-muted-foreground'>
              {formatFileSize(doc.sizeBytes)}
            </p>
          </div>
        </div>
        <div className='flex flex-wrap gap-2'>
          {(isPdf || isImage) && (
            <Button
              type='button'
              variant='secondary'
              size='sm'
              className='cursor-pointer'
              onClick={() =>
                onPreview({
                  url: doc.url,
                  name: doc.originalName,
                  mimeType: doc.mimeType,
                })
              }
            >
              Ver en esta página
            </Button>
          )}
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='cursor-pointer'
            asChild
          >
            <a
              href={doc.url}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1.5'
            >
              <ExternalLink className='h-3.5 w-3.5' aria-hidden />
              Abrir en otra pestaña
            </a>
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='cursor-pointer'
            asChild
          >
            <a href={doc.url} download={doc.originalName}>
              <Download className='h-3.5 w-3.5 mr-1' aria-hidden />
              Descargar
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function DocumentPreviewDialog({
  open,
  onOpenChange,
  doc,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: DocPreview | null;
}) {
  if (!doc) return null;
  const isImage = doc.mimeType?.toLowerCase().startsWith('image/');
  const isPdf = doc.mimeType?.toLowerCase() === 'application/pdf';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl w-[calc(100%-2rem)] max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden'>
        <DialogHeader className='px-6 pt-6 pb-2 shrink-0 text-left'>
          <DialogTitle className='text-base pr-8 line-clamp-2'>
            {doc.name}
          </DialogTitle>
        </DialogHeader>
        <div className='flex-1 min-h-0 px-6 pb-6 overflow-auto'>
          {isImage ? (
            <img
              src={doc.url}
              alt={doc.name}
              className='max-w-full h-auto rounded-md border mx-auto block'
            />
          ) : isPdf ? (
            <iframe
              title={doc.name}
              src={doc.url}
              className='w-full min-h-[70vh] rounded-md border bg-muted/30'
            />
          ) : (
            <p className='text-sm text-muted-foreground py-8 text-center'>
              No hay vista previa para este archivo. Podés abrirlo en otra pestaña.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PayoutDetailContent({
  payout,
}: {
  payout: GetUserPayoutDetailsResponse;
}) {
  const [previewDoc, setPreviewDoc] = useState<DocPreview | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const openPreview = (p: DocPreview) => {
    setPreviewDoc(p);
    setPreviewOpen(true);
  };

  const hasUploadedDocs = payout.documents && payout.documents.length > 0;

  const methodMeta = payout.payoutMethod?.metadata;
  const bankName =
    methodMeta &&
    typeof methodMeta === 'object' &&
    methodMeta !== null &&
    ('bankName' in methodMeta || 'bank_name' in methodMeta)
      ? ('bankName' in methodMeta
          ? methodMeta.bankName
          : methodMeta.bank_name)
      : undefined;
  const accountNumber =
    methodMeta &&
    typeof methodMeta === 'object' &&
    methodMeta !== null &&
    ('accountNumber' in methodMeta || 'account_number' in methodMeta)
      ? ('accountNumber' in methodMeta
          ? methodMeta.accountNumber
          : methodMeta.account_number)
      : undefined;
  const paypalEmail =
    methodMeta &&
    typeof methodMeta === 'object' &&
    methodMeta !== null &&
    'email' in methodMeta
      ? (methodMeta.email as string)
      : undefined;

  return (
    <>
      <div className='grid grid-cols-1 lg:grid-cols-[1fr_min(300px,100%)] gap-4 items-start'>
        {/* Main column — documents & activity first on desktop */}
        <div className='space-y-4 min-w-0 order-2 lg:order-1'>
          <Card className='overflow-hidden'>
            <CardHeader className={payoutSectionHeaderClass}>
              <CardTitle className='text-sm font-medium leading-snug flex items-center gap-2 text-muted-foreground'>
                <FileText className='h-4 w-4 shrink-0' aria-hidden />
                Comprobantes
              </CardTitle>
            </CardHeader>
            <CardContent className='p-4 space-y-4'>
              {!hasUploadedDocs ? (
                <p className='text-sm text-muted-foreground leading-relaxed'>
                  Cuando procesemos el retiro, acá puede aparecer el comprobante
                  u otros archivos que subamos desde soporte.
                </p>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  {payout.documents.map(doc => (
                    <PayoutDocumentBlock
                      key={doc.id}
                      doc={doc}
                      onPreview={openPreview}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {payout.notes && (
            <div className='rounded-lg border bg-muted/30 px-4 py-3 text-sm'>
              <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5'>
                Nota de Revendiste
              </p>
              <p className='text-muted-foreground whitespace-pre-wrap leading-relaxed'>
                {payout.notes}
              </p>
            </div>
          )}

          <PayoutActivitySection payout={payout} />

          {payout.linkedEarnings && payout.linkedEarnings.length > 0 && (
            <LinkedEarningsSection linkedEarnings={payout.linkedEarnings} />
          )}
        </div>

        {/* Sidebar — single summary card */}
        <div className='lg:sticky lg:top-4 space-y-3 order-1 lg:order-2'>
          <Card>
            <CardContent className='p-4 space-y-4'>
              <div className='flex items-start gap-3'>
                <div
                  className={cn(
                    'shrink-0 h-9 w-9 rounded-lg flex items-center justify-center',
                    payout.payoutMethod?.payoutType === PayoutType.Paypal
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {payout.payoutMethod?.payoutType === PayoutType.Paypal ? (
                    <Mail className='h-4 w-4' aria-hidden />
                  ) : (
                    <Landmark className='h-4 w-4' aria-hidden />
                  )}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='font-semibold text-sm leading-snug'>
                    Retiro{' '}
                    <span className='text-muted-foreground font-mono text-xs'>
                      {payout.id.slice(0, 8)}…
                    </span>
                  </p>
                  <p className='text-xs text-muted-foreground mt-0.5 flex items-center gap-1'>
                    <Wallet className='h-3 w-3 shrink-0' aria-hidden />
                    Resumen
                  </p>
                </div>
              </div>

              <div className='flex flex-wrap items-center justify-between gap-2'>
                {getStatusBadge(payout.status)}
              </div>

              <div className='rounded-lg bg-muted/40 px-3 py-2.5'>
                <p className='text-xs text-muted-foreground'>Monto</p>
                <p className='text-xl font-semibold tabular-nums tracking-tight'>
                  {formatCurrency(payout.amount, payout.currency)}
                </p>
              </div>

              <div className='space-y-2.5 pt-1 border-t'>
                <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                  Fechas y datos
                </p>
                <DetailRow
                  label='Solicitado'
                  value={formatSmartDateTime(payout.requestedAt)}
                />
                <DetailRow
                  label='Procesado'
                  value={
                    payout.processedAt
                      ? formatSmartDateTime(payout.processedAt)
                      : undefined
                  }
                />
                <DetailRow
                  label='Completado'
                  value={
                    payout.completedAt
                      ? formatSmartDateTime(payout.completedAt)
                      : undefined
                  }
                />
                <DetailRow
                  label='Falló'
                  value={
                    payout.failedAt
                      ? formatSmartDateTime(payout.failedAt)
                      : undefined
                  }
                />
                <DetailRow
                  label='Comisión'
                  value={
                    payout.processingFee
                      ? formatCurrency(
                          String(payout.processingFee),
                          payout.currency,
                        )
                      : undefined
                  }
                />
                <DetailRow
                  label='Referencia'
                  value={
                    payout.transactionReference ? (
                      <span className='font-mono text-xs break-all'>
                        {payout.transactionReference}
                      </span>
                    ) : undefined
                  }
                />
              </div>

              {payout.payoutMethod && (
                <div className='space-y-2.5 pt-1 border-t'>
                  <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                    Método de pago
                  </p>
                  <DetailRow
                    label='Tipo'
                    value={
                      payout.payoutMethod.payoutType === PayoutType.UruguayanBank
                        ? 'Banco en Uruguay'
                        : 'PayPal'
                    }
                  />
                  <DetailRow
                    label='Titular'
                    value={`${payout.payoutMethod.accountHolderName} ${payout.payoutMethod.accountHolderSurname}`}
                  />
                  {bankName && <DetailRow label='Banco' value={bankName} />}
                  {accountNumber && (
                    <DetailRow
                      label='Cuenta'
                      value={
                        <span className='font-mono text-xs'>{accountNumber}</span>
                      }
                    />
                  )}
                  {paypalEmail && (
                    <DetailRow label='Email' value={paypalEmail} />
                  )}
                  <DetailRow
                    label='Moneda'
                    value={payout.payoutMethod.currency}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <DocumentPreviewDialog
        open={previewOpen}
        onOpenChange={open => {
          setPreviewOpen(open);
          if (!open) setPreviewDoc(null);
        }}
        doc={previewDoc}
      />
    </>
  );
}
