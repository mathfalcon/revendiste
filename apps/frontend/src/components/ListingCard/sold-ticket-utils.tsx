import {
  Upload,
  FileCheck,
  AlertCircle,
  Clock,
  XCircle,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import {UploadAvailabilityReason} from '~/lib';
import {getUploadUnavailableMessage} from '~/utils';

export type TicketStatus =
  | 'complete'
  | 'attention'
  | 'pending'
  | 'expired'
  | 'waiting'
  | 'will_be_refunded';

export interface TicketStatusConfig {
  status: TicketStatus;
  statusText: string | null;
  statusIcon: React.ReactNode;
  cardClass: string;
  badgeClass: string;
  iconBgClass: string;
  iconClass: string;
  buttonClass: string;
  buttonIcon: React.ReactNode;
  buttonText: string;
  disabled: boolean;
  tooltipMessage: string | null;
  hideButton: boolean;
  isViewOnly: boolean;
}

interface GetStatusConfigParams {
  hasDocument: boolean;
  canUpload: boolean;
  documentNeedsAttention: boolean;
  isEventPast: boolean;
  isSold: boolean;
  uploadUnavailableReason?: UploadAvailabilityReason | null;
  uploadAvailableAt?: string | null;
}

/**
 * Get the status configuration for a sold ticket based on its current state.
 * This determines the visual styling, badge text, and available actions.
 *
 * Refund status is derived: if event has ended + no document + ticket was sold = will be refunded
 */
export function getTicketStatusConfig({
  hasDocument,
  canUpload,
  documentNeedsAttention,
  isEventPast,
  isSold,
  uploadUnavailableReason,
  uploadAvailableAt,
}: GetStatusConfigParams): TicketStatusConfig {
  // Priority 0: Derived refund status - seller failed to deliver
  // If event has ended, ticket was sold, and no document uploaded = will be refunded
  if (isEventPast && isSold && !hasDocument) {
    return {
      status: 'will_be_refunded',
      statusText: 'Será reembolsado',
      statusIcon: <AlertTriangle className='h-4 w-4' />,
      cardClass: 'border-yellow-500/50 bg-yellow-500/10',
      badgeClass: 'bg-yellow-500/20 text-yellow-600',
      iconBgClass: 'bg-yellow-500/20',
      iconClass: 'text-yellow-600',
      buttonClass: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
      buttonIcon: <AlertTriangle className='h-4 w-4' />,
      buttonText: 'Ver detalles',
      disabled: true,
      tooltipMessage:
        'No subiste el ticket antes del evento. El comprador será reembolsado.',
      hideButton: true,
      isViewOnly: true,
    };
  }

  // Priority 1: Document exists
  if (hasDocument) {
    if (documentNeedsAttention) {
      return {
        status: 'attention',
        statusText: 'Requiere revisión',
        statusIcon: <AlertCircle className='h-4 w-4' />,
        cardClass: 'border-yellow-500/30 bg-yellow-500/5',
        badgeClass: 'bg-yellow-500/10 text-yellow-500',
        iconBgClass: 'bg-yellow-500/10',
        iconClass: 'text-yellow-500',
        buttonClass:
          'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/30',
        buttonIcon: <AlertCircle className='h-4 w-4' />,
        buttonText: 'Revisar',
        disabled: false,
        tooltipMessage: null,
        hideButton: false,
        isViewOnly: false,
      };
    }

    // Past events: view-only mode
    if (isEventPast) {
      return {
        status: 'complete',
        statusText: 'Ticket subido',
        statusIcon: <FileCheck className='h-4 w-4' />,
        cardClass: 'border-green-500/30 bg-green-500/5',
        badgeClass: 'bg-green-500/10 text-green-500',
        iconBgClass: 'bg-green-500/10',
        iconClass: 'text-green-500',
        buttonClass:
          'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/30',
        buttonIcon: <Eye className='h-4 w-4' />,
        buttonText: 'Ver',
        disabled: false,
        tooltipMessage: null,
        hideButton: false,
        isViewOnly: true,
      };
    }

    // Active events: can view and edit
    return {
      status: 'complete',
      statusText: 'Ticket subido',
      statusIcon: <FileCheck className='h-4 w-4' />,
      cardClass: 'border-green-500/30 bg-green-500/5',
      badgeClass: 'bg-green-500/10 text-green-500',
      iconBgClass: 'bg-green-500/10',
      iconClass: 'text-green-500',
      buttonClass:
        'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/30',
      buttonIcon: <Eye className='h-4 w-4' />,
      buttonText: 'Ver/Editar',
      disabled: false,
      tooltipMessage: null,
      hideButton: false,
      isViewOnly: false,
    };
  }

  // Priority 2: Can upload (no document yet)
  if (canUpload) {
    return {
      status: 'pending',
      statusText: 'Falta documento',
      statusIcon: <Upload className='h-4 w-4' />,
      cardClass: 'border-orange-500/30 bg-orange-500/5',
      badgeClass: 'bg-orange-500/10 text-orange-500',
      iconBgClass: 'bg-orange-500/10',
      iconClass: 'text-orange-500',
      buttonClass:
        'bg-primary text-primary-foreground hover:bg-primary/90 border-primary',
      buttonIcon: <Upload className='h-4 w-4' />,
      buttonText: 'Subir ticket',
      disabled: false,
      tooltipMessage: null,
      hideButton: false,
      isViewOnly: false,
    };
  }

  // Priority 3: Cannot upload - either expired or waiting
  const isEventEnded = uploadUnavailableReason === 'event_ended';
  const tooltipMessage = uploadUnavailableReason
    ? getUploadUnavailableMessage(
        uploadUnavailableReason,
        '',
        uploadAvailableAt ?? undefined,
      )
    : 'No disponible';

  return {
    status: isEventEnded ? 'expired' : 'waiting',
    statusText: isEventEnded ? 'Expirado' : null,
    statusIcon: isEventEnded ? <XCircle className='h-4 w-4' /> : null,
    cardClass: isEventEnded
      ? 'border-destructive/30 bg-destructive/5'
      : 'border-border bg-muted/30',
    badgeClass: isEventEnded ? 'bg-destructive/10 text-destructive' : '',
    iconBgClass: isEventEnded ? 'bg-destructive/10' : 'bg-muted',
    iconClass: isEventEnded ? 'text-destructive' : 'text-muted-foreground',
    buttonClass: isEventEnded
      ? 'bg-destructive/10 text-destructive border-destructive/30'
      : 'bg-muted text-muted-foreground border-border',
    buttonIcon: isEventEnded ? (
      <XCircle className='h-4 w-4' />
    ) : (
      <Clock className='h-4 w-4' />
    ),
    buttonText: isEventEnded ? 'Expirado' : 'Próximamente',
    disabled: true,
    tooltipMessage,
    hideButton: false,
    isViewOnly: false,
  };
}
