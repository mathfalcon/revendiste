import {Card, CardContent} from '~/components/ui/card';
import {Calendar, Clock, MapPin, Ticket, Info} from 'lucide-react';
import {formatEventDate} from '~/utils/string';
import {getUploadUnavailableMessage} from '~/utils';
import type {GetUserListingsResponse} from '~/lib/api/generated';

interface TicketWaitingCardProps {
  ticket: GetUserListingsResponse[number]['tickets'][number] & {
    listing: GetUserListingsResponse[number];
  };
}

export function TicketWaitingCard({ticket}: TicketWaitingCardProps) {
  const event = ticket.listing.event;
  const ticketWave = ticket.listing.ticketWave;
  const eventStartDate = new Date(event.eventStartDate);

  const waitingMessage =
    ticket.uploadUnavailableReason &&
    getUploadUnavailableMessage(
      ticket.uploadUnavailableReason,
      event.platform,
      ticket.uploadAvailableAt,
    );

  return (
    <Card className='overflow-hidden border-border bg-muted/30'>
      <CardContent className='p-0'>
        <div className='flex'>
          {/* Left accent bar */}
          <div className='w-1.5 bg-gradient-to-b from-muted-foreground/40 to-muted-foreground/60' />

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
              <div className='flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground'>
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

            {/* Waiting message */}
            <div className='mt-4 flex items-start gap-3 rounded-lg bg-muted p-3'>
              <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted-foreground/10'>
                <Clock className='h-4 w-4 text-muted-foreground' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='font-medium text-muted-foreground text-sm'>
                  Próximamente disponible
                </p>
                {waitingMessage && (
                  <p className='text-sm text-muted-foreground/80 mt-0.5 flex items-start gap-1'>
                    <Info className='h-3.5 w-3.5 shrink-0 mt-0.5' />
                    <span>{waitingMessage}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
