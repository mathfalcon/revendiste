import {useState} from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import {TooltipProvider} from '~/components/ui/tooltip';
import {ChevronDown, TicketCheck, AlertCircle} from 'lucide-react';
import {cn} from '~/lib/utils';
import type {
  GetUserListingsResponse,
  EventTicketCurrency,
} from '~/lib/api/generated';
import {TicketDocumentViewerModal} from '~/components';
import {SoldTicketCard} from './SoldTicketCard';

interface SoldTicketsSectionProps {
  tickets: GetUserListingsResponse['data'][number]['tickets'];
  ticketWaveName: string;
  ticketWaveCurrency: EventTicketCurrency;
  onUploadClick: (ticketId: string) => void;
  isEventPast?: boolean;
}

export function SoldTicketsSection({
  tickets,
  ticketWaveName,
  ticketWaveCurrency,
  onUploadClick,
  isEventPast = false,
}: SoldTicketsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewingTicketId, setViewingTicketId] = useState<string | null>(null);

  if (tickets.length === 0) {
    return null;
  }

  // Count tickets that need document upload
  const ticketsNeedingDocument = tickets.filter(
    ticket => ticket.canUploadDocument && !ticket.hasDocument,
  ).length;

  const handleViewDocument = (ticketId: string) => {
    setViewingTicketId(ticketId);
  };

  const handleCloseViewer = () => {
    setViewingTicketId(null);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className='flex items-center justify-between w-full py-2 text-sm font-medium hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors'>
          <div className='flex items-center gap-2'>
            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10'>
              <TicketCheck className='h-3.5 w-3.5 text-green-600' />
            </div>
            <span>Entradas vendidas</span>
            <span className='text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full'>
              {tickets.length}
            </span>
            {/* Alert indicator for tickets needing document */}
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
        <TooltipProvider delayDuration={200}>
          <div className='space-y-2'>
            {tickets.map(ticket => (
              <SoldTicketCard
                key={ticket.id}
                ticket={ticket}
                ticketWaveName={ticketWaveName}
                ticketWaveCurrency={ticketWaveCurrency}
                isEventPast={isEventPast}
                onViewDocument={handleViewDocument}
                onUploadDocument={onUploadClick}
              />
            ))}
          </div>
        </TooltipProvider>
      </CollapsibleContent>

      {/* Document Viewer Modal */}
      {viewingTicketId && (
        <TicketDocumentViewerModal
          ticketId={viewingTicketId}
          open={!!viewingTicketId}
          onOpenChange={open => {
            if (!open) handleCloseViewer();
          }}
          isEventPast={isEventPast}
        />
      )}
    </Collapsible>
  );
}
