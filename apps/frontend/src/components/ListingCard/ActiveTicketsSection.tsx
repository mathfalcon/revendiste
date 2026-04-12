import {useState} from 'react';
import {
  Ticket,
  MoreVertical,
  Edit,
  Minus,
  Clock,
  ChevronDown,
  Upload,
  AlertCircle,
  Eye,
  Copy,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {TicketDocumentViewerModal} from '~/components';
import {cn} from '~/lib/utils';
import {copyToClipboard} from '~/utils/clipboard';
import {toast} from 'sonner';

interface ActiveTicketsSectionProps {
  tickets: GetUserListingsResponse['data'][number]['tickets'];
  ticketWaveCurrency: EventTicketCurrency;
  ticketWaveFaceValue: number;
  isEventPast?: boolean;
  onUploadClick?: (ticketId: string) => void;
}

export function ActiveTicketsSection({
  tickets,
  ticketWaveCurrency,
  ticketWaveFaceValue,
  isEventPast = false,
  onUploadClick,
}: ActiveTicketsSectionProps) {
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [removingTicketId, setRemovingTicketId] = useState<string | null>(null);
  const [viewingTicketId, setViewingTicketId] = useState<string | null>(null);
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
  const sectionLabel = isEventPast ? 'Entradas expiradas' : 'Entradas activas';
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

  const handleCardTap = (ticket: (typeof tickets)[number]) => {
    if (ticket.canUploadDocument && !ticket.hasDocument) {
      onUploadClick?.(ticket.id);
    } else if (ticket.hasDocument) {
      setViewingTicketId(ticket.id);
    } else if (!isEventPast) {
      setEditingTicketId(ticket.id);
    }
  };

  const handleCopyId = async (id: string) => {
    const success = await copyToClipboard(id);
    if (success) {
      toast.success('ID copiado');
    }
  };

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
                role='button'
                tabIndex={0}
                className={cn(
                  'rounded-xl border p-3 transition-all cursor-pointer active:scale-[0.98]',
                  cardBorderClass,
                )}
                onClick={() => handleCardTap(ticket)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardTap(ticket);
                  }
                }}
              >
                <div className='flex items-center justify-between gap-2'>
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
                      <p
                        className={cn(
                          'font-semibold',
                          isEventPast
                            ? 'text-muted-foreground'
                            : 'text-foreground',
                        )}
                      >
                        Entrada #{ticket.ticketNumber}
                      </p>
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
                      {/* Document status hint */}
                      {ticket.canUploadDocument && !ticket.hasDocument && (
                        <span className='text-xs text-orange-600 flex items-center gap-1 mt-0.5'>
                          <Upload className='h-3 w-3' />
                          Subir entrada
                        </span>
                      )}
                      {ticket.hasDocument && (
                        <span className='text-xs text-green-600 flex items-center gap-1 mt-0.5'>
                          <Eye className='h-3 w-3' />
                          Documento subido
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side: Actions dropdown */}
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
                    <DropdownMenuContent align='end' onClick={e => e.stopPropagation()}>
                      {ticket.hasDocument && (
                        <DropdownMenuItem
                          onClick={() => setViewingTicketId(ticket.id)}
                        >
                          <Eye className='mr-2 h-4 w-4' />
                          Ver documento
                        </DropdownMenuItem>
                      )}
                      {ticket.canUploadDocument && !ticket.hasDocument && (
                        <DropdownMenuItem
                          onClick={() => onUploadClick?.(ticket.id)}
                        >
                          <Upload className='mr-2 h-4 w-4' />
                          Subir entrada
                        </DropdownMenuItem>
                      )}
                      {!isEventPast && (
                        <>
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
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleCopyId(ticket.id)}
                      >
                        <Copy className='mr-2 h-4 w-4' />
                        Copiar ID
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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

      {/* Document Viewer Modal */}
      {viewingTicketId && (
        <TicketDocumentViewerModal
          ticketId={viewingTicketId}
          open={!!viewingTicketId}
          onOpenChange={open => {
            if (!open) setViewingTicketId(null);
          }}
          isEventPast={isEventPast}
        />
      )}
    </>
  );
}
