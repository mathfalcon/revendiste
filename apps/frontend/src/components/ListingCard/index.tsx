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
import {formatEventDate, formatPrice, calculateMaxResalePrice} from '~/utils';
import {Calendar, MapPin, DollarSign, Share2} from 'lucide-react';
import {CDN_ASSETS} from '~/assets';
import {CopyableText} from '~/components/ui/copyable-text';
import {copyToClipboard} from '~/utils/clipboard';
import {toast} from 'sonner';

interface ListingCardProps {
  listing: GetUserListingsResponse['data'][number];
}

export function ListingCard({listing}: ListingCardProps) {
  const {event, ticketWave, tickets} = listing;
  const navigate = useNavigate({from: '/cuenta/publicaciones'});

  const startDate = new Date(event.eventStartDate);
  const endDate = new Date(event.eventEndDate);
  const isEventPast = endDate < new Date();

  // Prefer flyer image, fall back to hero if not available
  const flyerImage =
    event.eventImages?.find(img => img.imageType === EventImageType.Flyer) ??
    event.eventImages?.find(img => img.imageType === EventImageType.Hero);
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

  const handleShareEvent = async () => {
    const eventUrl = `${window.location.origin}/eventos/${event.slug}`;

    // Try Web Share API first (mobile)
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: event.name,
          url: eventUrl,
        });
      } catch (error) {
        // AbortError means user canceled - don't show any toast
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        // Other errors - log them
        console.error('Error sharing:', error);
      }
      return;
    }

    // Fallback to clipboard (desktop)
    const success = await copyToClipboard(eventUrl);
    if (success) {
      toast.success('Enlace copiado');
    } else {
      toast.error('No se pudo copiar el enlace');
    }
  };

  // Filter tickets by status
  // deletedAt is used for cancelled/removed tickets
  const activeTickets = tickets.filter(
    ticket => !ticket.deletedAt && !ticket.soldAt,
  );
  const soldTickets = tickets.filter(
    ticket => ticket.soldAt && !ticket.deletedAt,
  );
  const cancelledTickets = tickets.filter(ticket => ticket.deletedAt);

  // Representative price for listing (first active ticket, or first ticket)
  const representativeTicket = activeTickets[0] ?? soldTickets[0] ?? tickets[0];
  const pricePerTicket = representativeTicket
    ? formatPrice(parseFloat(representativeTicket.price), ticketWave.currency)
    : null;

  const accentBarClass = isEventPast
    ? 'w-1.5 bg-linear-to-b from-muted-foreground/40 to-muted-foreground/60'
    : 'w-1.5 bg-linear-to-b from-blue-400 to-blue-500';
  const cardBgClass = isEventPast
    ? 'border-muted/50 bg-muted/20'
    : 'border-blue-500/20 bg-blue-500/5';

  return (
    <Card className={`w-full overflow-hidden ${cardBgClass}`}>
      <CardContent className='p-0'>
        <div className='flex'>
          {/* Left accent bar */}
          <div className={accentBarClass} />
          <div className='flex-1 p-4 space-y-4'>
            {/* Header with Event Image and Info */}
            <div className='flex gap-3'>
              {/* Event Flyer */}
              <Link
                to='/eventos/$slug'
                params={{slug: event.slug}}
                preloadDelay={0}
                className='shrink-0'
              >
                <img
                  src={imageSrc}
                  alt={event.name}
                  className='h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-lg'
                />
              </Link>

              {/* Event Info */}
              <div className='flex-1 flex-col flex'>
                <div className='flex items-start justify-between gap-1'>
                  <div className='min-w-0 flex-1'>
                    <Link
                      to='/eventos/$slug'
                      params={{slug: event.slug}}
                      preloadDelay={0}
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
                  <div className='flex items-center gap-2 shrink-0'>
                    {event.slug && (
                      <button
                        type='button'
                        onClick={handleShareEvent}
                        aria-label='Compartir evento'
                        className='p-1 text-muted-foreground hover:text-foreground transition-colors'
                      >
                        <Share2 className='h-4 w-4' />
                      </button>
                    )}
                    {isEventPast && (
                      <Badge
                        variant='outline'
                        className='text-muted-foreground'
                      >
                        Finalizado
                      </Badge>
                    )}
                  </div>
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
                {/* Precio por entrada */}
                {pricePerTicket && (
                  <div className='flex items-center gap-1.5 mt-2 text-sm'>
                    <DollarSign className='h-3.5 w-3.5 text-muted-foreground' />
                    <span className='text-muted-foreground'>
                      Precio por entrada:
                    </span>
                    <span className='font-medium'>{pricePerTicket}</span>
                  </div>
                )}
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
                ticketWaveCurrency={ticketWave.currency}
                ticketWaveFaceValue={calculateMaxResalePrice(
                  Number(ticketWave.faceValue),
                )}
                isEventPast={isEventPast}
                onUploadClick={handleUploadClick}
              />

              <SoldTicketsSection
                tickets={soldTickets}
                ticketWaveCurrency={ticketWave.currency}
                onUploadClick={handleUploadClick}
                isEventPast={isEventPast}
              />

              <CancelledTicketsSection tickets={cancelledTickets} />
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
