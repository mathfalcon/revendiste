import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {Button} from '~/components/ui/button';
import {Badge} from '~/components/ui/badge';
import {Calendar, FileCheck} from 'lucide-react';
import {formatEventDate} from '~/utils/string';
import type {ReturnTypeTicketListingsServiceAtGetUserListingsWithTickets} from '~/lib';

interface TicketWithDocumentCardProps {
  ticket: ReturnTypeTicketListingsServiceAtGetUserListingsWithTickets[number]['tickets'][number] & {
    listing: ReturnTypeTicketListingsServiceAtGetUserListingsWithTickets[number];
  };
  onEditClick: (ticketId: string) => void;
}

export function TicketWithDocumentCard({
  ticket,
  onEditClick,
}: TicketWithDocumentCardProps) {
  const event = ticket.listing.event;
  const ticketWave = ticket.listing.ticketWave;
  const eventStartDate = new Date(event.eventStartDate);

  return (
    <Card className='border-green-200'>
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
            className='bg-green-50 text-green-700 border-green-300'
          >
            Subido
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm text-muted-foreground'>
              Documento subido el{' '}
              {ticket.document?.uploadedAt
                ? new Date(ticket.document.uploadedAt).toLocaleDateString(
                    'es-ES',
                  )
                : 'N/A'}
            </p>
          </div>
          <Button
            onClick={() => onEditClick(ticket.id)}
            variant='outline'
            className='border-green-300 text-green-700 hover:bg-green-50'
          >
            <FileCheck className='mr-2 h-4 w-4' />
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

