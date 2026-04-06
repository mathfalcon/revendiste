import {Tooltip, TooltipContent, TooltipTrigger} from '~/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {Button} from '~/components/ui/button';
import {Info, TicketCheck, MoreVertical, Eye, Upload, Copy} from 'lucide-react';
import {cn} from '~/lib/utils';
import {formatPrice, calculateSellerAmount} from '~/utils';
import type {
  GetUserListingsResponse,
  EventTicketCurrency,
} from '~/lib/api/generated';
import {getTicketStatusConfig} from './sold-ticket-utils';
import {copyToClipboard} from '~/utils/clipboard';
import {toast} from 'sonner';

type Ticket = GetUserListingsResponse['data'][number]['tickets'][number];

interface SoldTicketCardProps {
  ticket: Ticket;
  ticketWaveCurrency: EventTicketCurrency;
  isEventPast: boolean;
  onViewDocument: (ticketId: string) => void;
  onUploadDocument: (ticketId: string) => void;
}

export function SoldTicketCard({
  ticket,
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

  const sellerBreakdown = calculateSellerAmount(
    parseFloat(ticket.price),
    ticketWaveCurrency,
  );

  const handleCardTap = () => {
    if (hasDocument) {
      onViewDocument(ticket.id);
    } else if (canUpload && !config.disabled) {
      onUploadDocument(ticket.id);
    }
  };

  const handleCopyId = async () => {
    const success = await copyToClipboard(ticket.id);
    if (success) {
      toast.success('ID copiado');
    }
  };

  return (
    <div
      role='button'
      tabIndex={0}
      className={cn(
        'rounded-xl border p-3 transition-all cursor-pointer active:scale-[0.98]',
        config.cardClass,
      )}
      onClick={handleCardTap}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardTap();
        }
      }}
    >
      <div className='flex items-center justify-between gap-2'>
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
                Entrada #{ticket.ticketNumber}
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
            <div className='flex flex-col gap-0.5 mt-0.5 text-sm'>
              <span className='font-medium'>
                {formatPrice(parseFloat(ticket.price), ticketWaveCurrency)}{' '}
                <span className='text-muted-foreground font-normal'>
                  · Recibís{' '}
                </span>
                <span className='font-medium'>
                  {formatPrice(sellerBreakdown.sellerAmount, ticketWaveCurrency)}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8 shrink-0'
              onClick={e => e.stopPropagation()}
            >
              <MoreVertical className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {hasDocument && (
              <DropdownMenuItem onClick={() => onViewDocument(ticket.id)}>
                <Eye className='mr-2 h-4 w-4' />
                Ver documento
              </DropdownMenuItem>
            )}
            {canUpload && !hasDocument && !config.disabled && (
              <DropdownMenuItem onClick={() => onUploadDocument(ticket.id)}>
                <Upload className='mr-2 h-4 w-4' />
                Subir entrada
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCopyId}>
              <Copy className='mr-2 h-4 w-4' />
              Copiar ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

