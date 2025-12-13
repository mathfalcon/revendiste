import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {Ticket} from 'lucide-react';
import type {ReturnTypeTicketListingsServiceAtGetUserListingsWithTickets} from '~/lib';

interface CancelledTicketsSectionProps {
  tickets: ReturnTypeTicketListingsServiceAtGetUserListingsWithTickets[number]['tickets'];
  ticketWaveName: string;
}

export function CancelledTicketsSection({
  tickets,
  ticketWaveName,
}: CancelledTicketsSectionProps) {
  if (tickets.length === 0) {
    return null;
  }

  return (
    <AccordionItem value='cancelled-tickets' className='border-none'>
      <AccordionTrigger className='py-2 text-sm font-medium hover:no-underline'>
        <div className='flex items-center gap-2'>
          <Ticket className='h-4 w-4 text-red-600' />
          Tickets cancelados ({tickets.length})
        </div>
      </AccordionTrigger>
      <AccordionContent className='pl-6'>
        <div className='space-y-2'>
          {tickets.map(ticket => (
            <div
              key={ticket.id}
              className='rounded-lg border border-red-200 bg-muted/50 p-3 text-sm'
            >
              <div className='flex items-center justify-between'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <p className='font-medium'>Ticket #{ticket.ticketNumber}</p>
                    <p className='text-xs text-muted-foreground font-mono'>
                      (ID: {ticket.id})
                    </p>
                  </div>
                  <p className='text-xs text-muted-foreground'>{ticketWaveName}</p>
                  <p className='text-muted-foreground'>Cancelado</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

