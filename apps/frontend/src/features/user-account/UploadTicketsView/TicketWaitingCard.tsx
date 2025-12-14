import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {Button} from '~/components/ui/button';
import {Badge} from '~/components/ui/badge';
import {Calendar, Timer} from 'lucide-react';
import {formatEventDate} from '~/utils/string';
import {getUploadUnavailableMessage} from '~/utils';
import type {ReturnTypeTicketListingsServiceAtGetUserListingsWithTickets} from '~/lib';

interface TicketWaitingCardProps {
  ticket: ReturnTypeTicketListingsServiceAtGetUserListingsWithTickets[number]['tickets'][number] & {
    listing: ReturnTypeTicketListingsServiceAtGetUserListingsWithTickets[number];
  };
}

export function TicketWaitingCard({ticket}: TicketWaitingCardProps) {
  const event = ticket.listing.event;
  const ticketWave = ticket.listing.ticketWave;
  const eventStartDate = new Date(event.eventStartDate);

  return (
    <Card className='border-gray-200 opacity-75'>
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
              </div>
            </div>
          </div>
          <Badge
            variant='outline'
            className='bg-gray-50 text-gray-500 border-gray-300'
          >
            Próximamente
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className='flex items-center justify-between'>
          <div>
            {ticket.uploadUnavailableReason && (
              <p className='text-sm text-muted-foreground'>
                {getUploadUnavailableMessage(
                  ticket.uploadUnavailableReason,
                  event.platform,
                ) || 'Los tickets estarán disponibles próximamente'}
              </p>
            )}
          </div>
          <Button disabled variant='outline'>
            <Timer className='mr-2 h-4 w-4' />
            No disponible
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

