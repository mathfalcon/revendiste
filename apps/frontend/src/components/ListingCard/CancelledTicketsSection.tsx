import {useState} from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import {Ticket, XCircle, ChevronDown} from 'lucide-react';
import {cn} from '~/lib/utils';
import type {GetUserListingsResponse} from '~/lib/api/generated';
import {TextEllipsis} from '../ui/text-ellipsis';
import {CopyableText} from '~/components/ui/copyable-text';

interface CancelledTicketsSectionProps {
  tickets: GetUserListingsResponse['data'][number]['tickets'];
  ticketWaveName: string;
}

export function CancelledTicketsSection({
  tickets,
  ticketWaveName,
}: CancelledTicketsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (tickets.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className='flex items-center justify-between w-full py-2 text-sm font-medium hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors'>
          <div className='flex items-center gap-2'>
            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-destructive/10'>
              <XCircle className='h-3.5 w-3.5 text-destructive' />
            </div>
            <span>Tickets cancelados</span>
            <span className='text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full'>
              {tickets.length}
            </span>
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
              className='rounded-xl border border-destructive/20 bg-destructive/5 p-3 transition-all'
            >
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10'>
                  <Ticket className='h-5 w-5 text-destructive' />
                </div>

                <div className='min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <TextEllipsis className='font-semibold text-foreground'>
                      Ticket #{ticket.ticketNumber} - {ticketWaveName}
                    </TextEllipsis>
                  </div>
                  {ticket.deletedAt && (
                    <p className='text-sm text-muted-foreground mt-0.5'>
                      Cancelado el{' '}
                      {new Date(ticket.deletedAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                  <CopyableText
                    text={ticket.id}
                    label='ID:'
                    truncateOnMobile
                    className='mt-1'
                    textClassName='text-xs text-muted-foreground'
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
