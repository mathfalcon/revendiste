import {useState} from 'react';
import {
  Ticket,
  MoreVertical,
  Edit,
  Minus,
  Clock,
  ChevronDown,
  Upload,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {Button} from '~/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import {formatPrice} from '~/utils/string';
import type {
  GetUserListingsResponse,
  EventTicketCurrency,
} from '~/lib/api/generated';
import {EditTicketPriceDialog} from './EditTicketPriceDialog';
import {RemoveTicketDialog} from './RemoveTicketDialog';
import {CopyableText} from '~/components/ui/copyable-text';
import {cn} from '~/lib/utils';

interface ActiveTicketsSectionProps {
  tickets: GetUserListingsResponse[number]['tickets'];
  ticketWaveName: string;
  ticketWaveCurrency: EventTicketCurrency;
  ticketWaveFaceValue: number;
  isEventPast?: boolean;
  onUploadClick?: (ticketId: string) => void;
}

export function ActiveTicketsSection({
  tickets,
  ticketWaveName,
  ticketWaveCurrency,
  ticketWaveFaceValue,
  isEventPast = false,
  onUploadClick,
}: ActiveTicketsSectionProps) {
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [removingTicketId, setRemovingTicketId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const editingTicket = tickets.find(t => t.id === editingTicketId);
  const removingTicket = tickets.find(t => t.id === removingTicketId);

  if (tickets.length === 0) {
    return null;
  }

  // Count tickets that can upload and need documents
  const ticketsNeedingDocument = tickets.filter(
    ticket => ticket.canUploadDocument && !ticket.hasDocument,
  ).length;

  // Different styling for expired vs active tickets
  const sectionLabel = isEventPast ? 'Tickets expirados' : 'Tickets activos';
  const iconColorClass = isEventPast
    ? 'text-muted-foreground'
    : 'text-blue-600';
  const iconBgClass = isEventPast ? 'bg-muted' : 'bg-blue-500/10';
  const badgeClass = isEventPast
    ? 'text-muted-foreground bg-muted'
    : 'text-blue-600 bg-blue-500/10';
  const cardBorderClass = isEventPast
    ? 'border-muted bg-muted/30'
    : 'border-blue-500/20 bg-blue-500/5';

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className='flex items-center justify-between w-full py-2 text-sm font-medium hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors'>
            <div className='flex items-center gap-2'>
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full',
                  iconBgClass,
                )}
              >
                {isEventPast ? (
                  <Clock className={cn('h-3.5 w-3.5', iconColorClass)} />
                ) : (
                  <Ticket className={cn('h-3.5 w-3.5', iconColorClass)} />
                )}
              </div>
              <span>{sectionLabel}</span>
              <span
                className={cn('text-xs px-2 py-0.5 rounded-full', badgeClass)}
              >
                {tickets.length}
              </span>
              {/* Alert indicator for tickets needing document upload */}
              {ticketsNeedingDocument > 0 && (
                <span className='flex items-center gap-1 text-xs text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-full'>
                  <AlertCircle className='h-3 w-3' />
                  <span>{ticketsNeedingDocument}</span>
                </span>
              )}
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                isOpen && 'rotate-180',
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className='pt-2'>
          <div className='space-y-2'>
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                className={cn(
                  'rounded-xl border p-3 transition-all',
                  cardBorderClass,
                )}
              >
                <div className='flex items-center justify-between gap-3'>
                  {/* Left side: Ticket info */}
                  <div className='flex items-center gap-3 min-w-0 flex-1'>
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                        iconBgClass,
                      )}
                    >
                      {isEventPast ? (
                        <Clock className={cn('h-5 w-5', iconColorClass)} />
                      ) : (
                        <Ticket className={cn('h-5 w-5', iconColorClass)} />
                      )}
                    </div>

                    <div className='min-w-0'>
                      <div className='flex items-center gap-2'>
                        <p
                          className={cn(
                            'font-semibold',
                            isEventPast
                              ? 'text-muted-foreground'
                              : 'text-foreground',
                          )}
                        >
                          Ticket #{ticket.ticketNumber} - {ticketWaveName}
                        </p>
                      </div>
                      <div className='flex items-center gap-1.5 mt-0.5'>
                        <span
                          className={cn(
                            'text-sm font-medium',
                            isEventPast && 'text-muted-foreground',
                          )}
                        >
                          {formatPrice(
                            parseFloat(ticket.price),
                            ticketWaveCurrency,
                          )}
                        </span>
                        {isEventPast && (
                          <span className='text-xs text-muted-foreground'>
                            · No vendido
                          </span>
                        )}
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

                  {/* Right side: Document status & Actions */}
                  <div className='flex items-center gap-2 shrink-0'>
                    {/* Document status indicator */}
                    {ticket.hasDocument ? (
                      <span className='flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-1 rounded-full'>
                        <CheckCircle className='h-3 w-3' />
                        Subido
                      </span>
                    ) : ticket.canUploadDocument ? (
                      <Button
                        variant='outline'
                        size='sm'
                        className='h-7 text-xs'
                        onClick={() => onUploadClick?.(ticket.id)}
                      >
                        <Upload className='mr-1.5 h-3 w-3' />
                        Subir ticket
                      </Button>
                    ) : null}

                    {/* Actions dropdown - only show for active events */}
                    {!isEventPast && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 shrink-0'
                          >
                            <MoreVertical className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => setEditingTicketId(ticket.id)}
                          >
                            <Edit className='mr-2 h-4 w-4' />
                            Editar precio
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className='text-destructive focus:text-destructive'
                            onClick={() => setRemovingTicketId(ticket.id)}
                          >
                            <Minus className='mr-2 h-4 w-4' />
                            Retirar de venta
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Edit Price Dialog */}
      {editingTicket && (
        <EditTicketPriceDialog
          open={editingTicketId !== null}
          onOpenChange={open => {
            if (!open) setEditingTicketId(null);
          }}
          ticketId={editingTicket.id}
          currentPrice={parseFloat(editingTicket.price)}
          maxPrice={ticketWaveFaceValue}
          currency={ticketWaveCurrency}
        />
      )}

      {/* Remove Ticket Dialog */}
      {removingTicket && (
        <RemoveTicketDialog
          open={removingTicketId !== null}
          onOpenChange={open => {
            if (!open) setRemovingTicketId(null);
          }}
          ticketId={removingTicket.id}
          ticketNumber={removingTicket.ticketNumber}
        />
      )}
    </>
  );
}
