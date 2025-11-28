import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {Button} from '~/components/ui/button';
import {Badge} from '~/components/ui/badge';
import {Calendar, MapPin, Upload} from 'lucide-react';
import {formatEventDate, formatPrice} from '~/utils/string';
import type {ReturnTypeTicketListingsServiceAtGetUserListingsWithTickets} from '~/lib';

interface TicketCardProps {
  ticket: ReturnTypeTicketListingsServiceAtGetUserListingsWithTickets[number]['tickets'][number] & {
    listing: ReturnTypeTicketListingsServiceAtGetUserListingsWithTickets[number];
  };
  onUploadClick: (ticketId: string) => void;
}

export function TicketNeedingUploadCard({ticket, onUploadClick}: TicketCardProps) {
  const event = ticket.listing.event;
  const ticketWave = ticket.listing.ticketWave;
  const eventStartDate = new Date(event.eventStartDate);

  return (
    <Card className='border-orange-200'>
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
              {event.venueName && (
                <div className='flex items-center gap-1'>
                  <MapPin className='h-4 w-4' />
                  {event.venueName}
                </div>
              )}
            </div>
          </div>
          <Badge
            variant='outline'
            className='bg-orange-50 text-orange-700 border-orange-300'
          >
            Pendiente
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm text-muted-foreground'>
              Vendido por:{' '}
              {formatPrice(parseFloat(ticket.price), ticketWave.currency)}
            </p>
          </div>
          <Button onClick={() => onUploadClick(ticket.id)} className='primary'>
            <Upload className='mr-2 h-4 w-4' />
            Subir ticket
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

