import {Link} from '@tanstack/react-router';
import {Card, CardContent} from '~/components/ui/card';
import {Calendar, MapPin, Ticket, XCircle, AlertTriangle} from 'lucide-react';
import {formatEventDate} from '~/utils/string';
import {EventImageType} from '~/lib/api/generated';
import type {GetUserListingsResponse} from '~/lib/api/generated';
import {CDN_ASSETS} from '~/assets';

interface TicketExpiredCardProps {
  ticket: GetUserListingsResponse['data'][number]['tickets'][number] & {
    listing: GetUserListingsResponse['data'][number];
  };
}

export function TicketExpiredCard({ticket}: TicketExpiredCardProps) {
  const event = ticket.listing.event;
  const ticketWave = ticket.listing.ticketWave;
  const eventStartDate = new Date(event.eventStartDate);

  const flyerImage =
    event.eventImages?.find(img => img.imageType === EventImageType.Flyer) ??
    event.eventImages?.find(img => img.imageType === EventImageType.Hero);
  const imageSrc = flyerImage?.url ?? CDN_ASSETS.DEFAULT_OG_IMAGE;

  return (
    <Card className='overflow-hidden border-destructive/30 bg-destructive/5 opacity-80'>
      <CardContent className='p-0'>
        <div className='flex'>
          {/* Left accent bar */}
          <div className='w-1.5 bg-linear-to-b from-destructive/60 to-destructive' />

          <div className='flex-1 p-4'>
            {/* Header with event image and info */}
            <div className='flex gap-3'>
              <Link
                to='/eventos/$slug'
                params={{slug: event.slug}}
                preloadDelay={0}
                className='shrink-0'
              >
                <img
                  src={imageSrc}
                  alt={event.name}
                  className='h-16 w-16 rounded-lg object-cover object-center sm:h-20 sm:w-20'
                />
              </Link>

              <div className='min-w-0 flex-1'>
                <div className='flex items-start justify-between gap-2'>
                  <h3 className='font-semibold text-base leading-tight line-clamp-2 text-foreground'>
                    {event.name}
                  </h3>
                  <div className='flex items-center gap-1.5 rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive shrink-0'>
                    <Ticket className='h-3 w-3' />
                    <span>#{ticket.ticketNumber}</span>
                  </div>
                </div>
                <p className='text-sm text-muted-foreground mt-0.5'>
                  {ticketWave.name}
                </p>

                {/* Event details */}
                <div className='flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-muted-foreground'>
                  <div className='flex items-center gap-1'>
                    <Calendar className='h-3.5 w-3.5' />
                    <span>{formatEventDate(eventStartDate)}</span>
                  </div>
                  {event.venueName && (
                    <div className='hidden sm:flex items-center gap-1'>
                      <MapPin className='h-3.5 w-3.5' />
                      <span className='truncate max-w-[150px]'>
                        {event.venueName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Expired message */}
            <div className='mt-4 flex items-start gap-3 rounded-lg bg-destructive/10 p-3'>
              <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/20'>
                <XCircle className='h-4 w-4 text-destructive' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='font-medium text-destructive text-sm'>
                  Evento finalizado
                </p>
                <p className='text-sm text-muted-foreground mt-0.5 flex items-start gap-1'>
                  <AlertTriangle className='h-3.5 w-3.5 shrink-0 mt-0.5 text-destructive/70' />
                  <span>
                    El período para subir documentos ha expirado. Contacta a
                    soporte si necesitas ayuda.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
