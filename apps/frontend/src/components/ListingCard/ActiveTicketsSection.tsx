import {useState} from 'react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {Ticket, MoreVertical, Edit, Minus} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {formatPrice} from '~/utils/string';
import type {
  GetUserListingsResponse,
  EventTicketCurrency,
} from '~/lib/api/generated';
import {EditTicketPriceDialog} from './EditTicketPriceDialog';
import {RemoveTicketDialog} from './RemoveTicketDialog';

interface ActiveTicketsSectionProps {
  tickets: GetUserListingsResponse[number]['tickets'];
  ticketWaveName: string;
  ticketWaveCurrency: EventTicketCurrency;
  ticketWaveFaceValue: number;
}

export function ActiveTicketsSection({
  tickets,
  ticketWaveName,
  ticketWaveCurrency,
  ticketWaveFaceValue,
}: ActiveTicketsSectionProps) {
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [removingTicketId, setRemovingTicketId] = useState<string | null>(null);

  const editingTicket = tickets.find(t => t.id === editingTicketId);
  const removingTicket = tickets.find(t => t.id === removingTicketId);
  if (tickets.length === 0) {
    return null;
  }

  return (
    <AccordionItem value='active-tickets' className='border-none'>
      <AccordionTrigger className='py-2 text-sm font-medium hover:no-underline'>
        <div className='flex items-center gap-2'>
          <Ticket className='h-4 w-4 text-blue-600' />
          Tickets activos ({tickets.length})
        </div>
      </AccordionTrigger>
      <AccordionContent className='pl-6'>
        <div className='space-y-2'>
          {tickets.map(ticket => (
            <div
              key={ticket.id}
              className='rounded-lg border bg-muted/50 p-3 text-sm'
            >
              <div className='flex items-center justify-between'>
                <div className='space-y-1 flex-1'>
                  <div className='flex items-center gap-2'>
                    <p className='font-medium'>Ticket #{ticket.ticketNumber}</p>
                    <p className='text-xs text-muted-foreground font-mono'>
                      (ID: {ticket.id})
                    </p>
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {ticketWaveName}
                  </p>
                  <p className='text-muted-foreground'>
                    Precio:{' '}
                    {formatPrice(parseFloat(ticket.price), ticketWaveCurrency)}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className='rounded-sm p-1 hover:bg-accent focus:outline-none'>
                      <MoreVertical className='h-4 w-4' />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                      onClick={() => setEditingTicketId(ticket.id)}
                    >
                      <Edit className='mr-2 h-4 w-4' />
                      Editar precio
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='text-red-600'
                      onClick={() => setRemovingTicketId(ticket.id)}
                    >
                      <Minus className='mr-2 h-4 w-4' />
                      Retirar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </AccordionContent>

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
    </AccordionItem>
  );
}
