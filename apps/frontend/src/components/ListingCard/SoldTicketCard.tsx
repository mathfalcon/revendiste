import {Tooltip, TooltipContent, TooltipTrigger} from '~/components/ui/tooltip';
import {Info, TicketCheck} from 'lucide-react';
import {cn} from '~/lib/utils';
import {formatPrice} from '~/utils';
import type {
  GetUserListingsResponse,
  EventTicketCurrency,
} from '~/lib/api/generated';
import {getTicketStatusConfig} from './sold-ticket-utils';
import {CopyableText} from '~/components/ui/copyable-text';

type Ticket = GetUserListingsResponse[number]['tickets'][number];

interface SoldTicketCardProps {
  ticket: Ticket;
  ticketWaveName: string;
  ticketWaveCurrency: EventTicketCurrency;
  isEventPast: boolean;
  onViewDocument: (ticketId: string) => void;
  onUploadDocument: (ticketId: string) => void;
}

export function SoldTicketCard({
  ticket,
  ticketWaveName,
  ticketWaveCurrency,
  isEventPast,
  onViewDocument,
  onUploadDocument,
}: SoldTicketCardProps) {
  const hasDocument = ticket.hasDocument;
  const canUpload = ticket.canUploadDocument;
  const documentNeedsAttention = false; // For future: check if status is 'rejected' or 'pending'

  const config = getTicketStatusConfig({
    hasDocument,
    canUpload,
    documentNeedsAttention,
    isEventPast,
    isSold: !!ticket.soldAt,
    uploadUnavailableReason: ticket.uploadUnavailableReason,
    uploadAvailableAt: ticket.uploadAvailableAt,
  });

  const handleButtonClick = () => {
    if (config.disabled) return;

    if (hasDocument) {
      onViewDocument(ticket.id);
    } else {
      onUploadDocument(ticket.id);
    }
  };

  return (
    <div
      className={cn('rounded-xl border p-3 transition-all', config.cardClass)}
    >
      <div className='flex items-center justify-between gap-3'>
        {/* Left side: Ticket info */}
        <div className='flex items-center gap-3 min-w-0 flex-1'>
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              config.iconBgClass,
            )}
          >
            <TicketCheck className={cn('h-5 w-5', config.iconClass)} />
          </div>

          <div className='min-w-0'>
            <div className='flex items-center gap-2 flex-wrap'>
              <p className='font-semibold text-foreground'>
                Ticket #{ticket.ticketNumber} - {ticketWaveName}
              </p>
              {config.statusText && (
                <StatusBadge
                  text={config.statusText}
                  icon={config.statusIcon}
                  className={config.badgeClass}
                  tooltipMessage={config.hideButton ? config.tooltipMessage : null}
                />
              )}
            </div>
            <div className='flex items-center gap-1.5 mt-0.5'>
              <span className='text-sm font-medium'>
                {formatPrice(parseFloat(ticket.price), ticketWaveCurrency)}
              </span>
            </div>
            <CopyableText
              text={ticket.id}
              label='ID:'
              truncateOnMobile
              className='mt-1'
              textClassName='text-xs text-muted-foreground'
            />
          </div>
        </div>

        {/* Right side: Action button */}
        {!config.hideButton && (
          <div className='shrink-0'>
            <ActionButton
              config={config}
              onClick={handleButtonClick}
              disabled={config.disabled}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-components for better organization

interface StatusBadgeProps {
  text: string;
  icon: React.ReactNode;
  className: string;
  tooltipMessage?: string | null;
}

function StatusBadge({text, icon, className, tooltipMessage}: StatusBadgeProps) {
  const badge = (
    <span
      className={cn(
        'inline-flex items-center text-xs px-2 py-0.5 rounded-full',
        tooltipMessage && 'cursor-help',
        className,
      )}
    >
      {icon}
      <span className='ml-1'>{text}</span>
    </span>
  );

  if (tooltipMessage) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side='top' className='max-w-[280px]'>
          <div className='flex items-start gap-2'>
            <Info className='h-4 w-4 shrink-0 mt-0.5' />
            <p>{tooltipMessage}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}

interface ActionButtonProps {
  config: ReturnType<typeof getTicketStatusConfig>;
  onClick: () => void;
  disabled: boolean;
}

function ActionButton({config, onClick, disabled}: ActionButtonProps) {
  const button = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all border',
        config.buttonClass,
        disabled ? 'cursor-not-allowed opacity-80' : 'hover:shadow-sm',
      )}
    >
      {config.buttonIcon}
      <span className='hidden sm:inline'>{config.buttonText}</span>
    </button>
  );

  // Wrap with tooltip if disabled and has tooltip message
  if (disabled && config.tooltipMessage) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className='inline-block cursor-not-allowed'>{button}</span>
        </TooltipTrigger>
        <TooltipContent side='top' className='max-w-[280px]'>
          <div className='flex items-start gap-2'>
            <Info className='h-4 w-4 shrink-0 mt-0.5' />
            <p>{config.tooltipMessage}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
