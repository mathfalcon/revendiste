import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {Badge} from '~/components/ui/badge';
import {Calendar, XCircle} from 'lucide-react';
import {formatEventDate} from '~/utils/string';
import type {ReturnTypeTicketListingsServiceAtGetUserListingsWithTickets} from '~/lib';

interface TicketExpiredCardProps {
  ticket: ReturnTypeTicketListingsServiceAtGetUserListingsWithTickets[number]['tickets'][number] & {
    listing: ReturnTypeTicketListingsServiceAtGetUserListingsWithTickets[number];
  };
}

export function TicketExpiredCard({ticket}: TicketExpiredCardProps) {
  const event = ticket.listing.event;
  const ticketWave = ticket.listing.ticketWave;
  const eventStartDate = new Date(event.eventStartDate);
  const eventEndDate = new Date(event.eventEndDate);

  return (
    <Card className='border-red-200 opacity-75'>
      <CardHeader>
        <div className='flex items-start justify-between'>
          <div className='space-y-1 flex-1'>
            <CardTitle className='text-lg'>{event.name}</CardTitle>
            <CardDescription>
              {ticketWave.name} - Ticket #{ticket.ticketNumber}
            </CardDescription>
            <div className='flex items-center gap-4 text-sm text-muted-foreground mt-2'>
              <div className='flex items-center gap-1'>
                <Calendar className='h-4 w-4' />
                {formatEventDate(eventStartDate)}
                {eventEndDate.getTime() !== eventStartDate.getTime() && (
                  <span className='ml-1'>
                    - {formatEventDate(eventEndDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Badge
            variant='outline'
            className='bg-red-50 text-red-600 border-red-300'
          >
            Expirado
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm text-muted-foreground'>
              El evento ya finalizó. No se pueden subir más documentos.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

