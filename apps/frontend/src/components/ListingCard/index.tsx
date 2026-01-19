import {useNavigate, Link} from '@tanstack/react-router';
import {
  type GetUserListingsResponse,
  EventImageType,
} from '~/lib/api/generated';
import {Card, CardContent} from '~/components/ui/card';
import {Badge} from '~/components/ui/badge';
import {Separator} from '~/components/ui/separator';
import {EventInfoBadges} from '~/components/EventInfoBadges';
import {ActiveTicketsSection} from './ActiveTicketsSection';
import {SoldTicketsSection} from './SoldTicketsSection';
import {CancelledTicketsSection} from './CancelledTicketsSection';
import {formatEventDate} from '~/utils/string';
import {Calendar, MapPin} from 'lucide-react';
import {CDN_ASSETS} from '~/assets';
import {CopyableText} from '~/components/ui/copyable-text';

interface ListingCardProps {
  listing: GetUserListingsResponse[number];
}

export function ListingCard({listing}: ListingCardProps) {
  const {event, ticketWave, tickets} = listing;
  const navigate = useNavigate({from: '/cuenta/publicaciones'});

  const startDate = new Date(event.eventStartDate);
  const endDate = new Date(event.eventEndDate);
  const isEventPast = endDate < new Date();

  // Get flyer image
  const flyerImage = event.eventImages?.find(
    img => img.imageType === EventImageType.Flyer,
  );
  const imageSrc = flyerImage?.url ?? CDN_ASSETS.DEFAULT_OG_IMAGE;

  const handleUploadClick = (ticketId: string) => {
    navigate({
      search: prev => ({
        ...prev,
        subirTicket: ticketId,
      }),
      resetScroll: false,
    });
  };

  // Filter tickets by status
  // deletedAt is used for cancelled/removed tickets
  const activeTickets = tickets.filter(
    ticket => !ticket.deletedAt && !ticket.soldAt,
  );
  const soldTickets = tickets.filter(ticket => ticket.soldAt && !ticket.deletedAt);
  const cancelledTickets = tickets.filter(ticket => ticket.deletedAt);

  return (
    <Card className='w-full overflow-hidden'>
      <CardContent className='p-4 space-y-4'>
        {/* Header with Event Image and Info */}
        <div className='flex gap-4'>
          {/* Event Flyer */}
          <Link
            to='/eventos/$eventId'
            params={{eventId: event.id}}
            className='shrink-0'
          >
            <img
              src={imageSrc}
              alt={event.name}
              className='w-20 h-20 sm:w-[100px] sm:h-[100px] object-cover rounded-lg'
            />
          </Link>

          {/* Event Info */}
          <div className='flex-1 flex-col flex'>
            <div className='flex items-start justify-between gap-1'>
              <div className='min-w-0 flex-1'>
                <Link
                  to='/eventos/$eventId'
                  params={{eventId: event.id}}
                  className='hover:text-primary transition-colors'
                >
                  <h3 className='font-semibold text-base sm:text-lg leading-tight line-clamp-2'>
                    {event.name}
                  </h3>
                </Link>
                <p className='text-sm text-muted-foreground mt-0.5'>
                  {ticketWave.name}
                </p>
              </div>
              {isEventPast && (
                <Badge
                  variant='outline'
                  className='shrink-0 text-muted-foreground'
                >
                  Finalizado
                </Badge>
              )}
            </div>

            {/* Event Details - Desktop */}
            <div className='hidden sm:block mt-2 space-y-1.5'>
              <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                <div className='flex items-center gap-1.5'>
                  <Calendar className='h-3.5 w-3.5' />
                  <span>{formatEventDate(startDate)}</span>
                </div>

                {event.venueName && (
                  <div className='flex items-center gap-1.5'>
                    <MapPin className='h-3.5 w-3.5' />
                    <span className='truncate max-w-[200px]'>
                      {event.venueName}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <EventInfoBadges
              qrAvailabilityTiming={event.qrAvailabilityTiming}
              className='mt-2'
              viewMode='seller'
            />
          </div>
        </div>

        {/* Event Details - Mobile */}
        <div className='sm:hidden text-sm text-muted-foreground space-y-1.5'>
          <div className='flex items-center gap-1.5'>
            <Calendar className='h-3.5 w-3.5' />
            <span>{formatEventDate(startDate)}</span>
          </div>

          {event.venueName && (
            <div className='flex items-center gap-1.5'>
              <MapPin className='h-3.5 w-3.5' />
              <span className='truncate'>{event.venueName}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Ticket Sections */}
        <div className='space-y-2'>
          <ActiveTicketsSection
            tickets={activeTickets}
            ticketWaveName={ticketWave.name}
            ticketWaveCurrency={ticketWave.currency}
            ticketWaveFaceValue={Number(ticketWave.faceValue)}
            isEventPast={isEventPast}
          />

          <SoldTicketsSection
            tickets={soldTickets}
            ticketWaveName={ticketWave.name}
            ticketWaveCurrency={ticketWave.currency}
            onUploadClick={handleUploadClick}
            isEventPast={isEventPast}
          />

          <CancelledTicketsSection
            tickets={cancelledTickets}
            ticketWaveName={ticketWave.name}
          />
        </div>

        {/* Listing ID for support/reporting */}
        <div className='pt-2 border-t'>
          <CopyableText
            text={listing.id}
            label='ID de publicación:'
            truncateOnMobile
            textClassName='text-xs text-muted-foreground'
          />
        </div>
      </CardContent>
    </Card>
  );
}
