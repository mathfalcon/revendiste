import {Card, CardContent} from '~/components/ui/card';
import {Button} from '~/components/ui/button';
import {Calendar, MapPin, Upload, Ticket, AlertCircle} from 'lucide-react';
import {formatEventDate, formatPrice} from '~/utils/string';
import type {GetUserListingsResponse} from '~/lib/api/generated';

interface TicketCardProps {
  ticket: GetUserListingsResponse[number]['tickets'][number] & {
    listing: GetUserListingsResponse[number];
  };
  onUploadClick: (ticketId: string) => void;
}

export function TicketNeedingUploadCard({
  ticket,
  onUploadClick,
}: TicketCardProps) {
  const event = ticket.listing.event;
  const ticketWave = ticket.listing.ticketWave;
  const eventStartDate = new Date(event.eventStartDate);

  return (
    <Card className='overflow-hidden border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 transition-colors'>
      <CardContent className='p-0'>
        <div className='flex'>
          {/* Left accent bar */}
          <div className='w-1.5 bg-gradient-to-b from-orange-400 to-orange-500' />

          <div className='flex-1 p-4'>
            {/* Header with event info */}
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0 flex-1'>
                <h3 className='font-semibold text-foreground truncate'>
                  {event.name}
                </h3>
                <p className='text-sm text-muted-foreground mt-0.5'>
                  {ticketWave.name}
                </p>
              </div>

              {/* Ticket badge */}
              <div className='flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1.5 text-sm font-medium text-orange-500'>
                <Ticket className='h-4 w-4' />
                <span>#{ticket.ticketNumber}</span>
              </div>
            </div>

            {/* Event details */}
            <div className='flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground'>
              <div className='flex items-center gap-1.5'>
                <Calendar className='h-4 w-4' />
                <span>{formatEventDate(eventStartDate)}</span>
              </div>
              {event.venueName && (
                <div className='flex items-center gap-1.5'>
                  <MapPin className='h-4 w-4' />
                  <span className='truncate max-w-[200px]'>
                    {event.venueName}
                  </span>
                </div>
              )}
            </div>

            {/* Action section */}
            <div className='mt-4 flex items-center justify-between gap-4 rounded-lg bg-orange-500/10 p-3'>
              <div className='flex items-center gap-3'>
                <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/20'>
                  <AlertCircle className='h-4 w-4 text-orange-500' />
                </div>
                <div>
                  <p className='font-medium text-orange-500 text-sm'>
                    Pendiente de subir
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Vendido por{' '}
                    <span className='font-medium text-foreground'>
                      {formatPrice(
                        parseFloat(ticket.price),
                        ticketWave.currency,
                      )}
                    </span>
                  </p>
                </div>
              </div>

              <Button
                onClick={() => onUploadClick(ticket.id)}
                className='bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
              >
                <Upload className='mr-2 h-4 w-4' />
                Subir ticket
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
