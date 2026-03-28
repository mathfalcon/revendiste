import {useSuspenseQuery} from '@tanstack/react-query';
import {EventDetails} from './EventDetails';
import {EventDescription} from './EventDescription';
import {TicketSelection} from './tickets';
import {EventInfoCards} from './EventInfoCards';
import {VenueMapLazy} from './VenueMapLazy';
import {EventImageType, getEventByIdQuery} from '~/lib';
import {useParams} from '@tanstack/react-router';
import {useEffect, useRef, useState} from 'react';
import {FullScreenLoading, TextEllipsis} from '~/components';
import {CDN_ASSETS} from '~/assets';

export const EventPage = () => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const params = useParams({from: '/eventos/$eventId'});
  const response = useSuspenseQuery(getEventByIdQuery(params.eventId));

  const event = response.data;
  const heroImage = event.eventImages.find(
    i => i.imageType === EventImageType.Hero,
  );
  const src = heroImage?.url ?? CDN_ASSETS.DEFAULT_OG_IMAGE;

  const lat = event.venueLatitude ? parseFloat(event.venueLatitude) : null;
  const lng = event.venueLongitude ? parseFloat(event.venueLongitude) : null;
  const hasCoordinates =
    lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);

  useEffect(() => {
    setImageLoaded(false);
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setImageLoaded(true);
    }
  }, [src]);

  return (
    <>
      {!imageLoaded && <FullScreenLoading />}

      {/* Mobile Image - No badges overlay */}
      <div className='md:hidden relative w-full min-h-[15vh] bg-muted'>
        <img
          key={src}
          ref={imgRef}
          src={src}
          alt={event.name}
          decoding='async'
          loading='eager'
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
          className='w-full h-full min-h-[15vh] max-h-[15vh] object-cover transition-opacity duration-300'
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 via-30% to-transparent pointer-events-none' />

        {/* Title - Mobile */}
        <div className='absolute bottom-0 left-0 right-0 p-4'>
          <TextEllipsis
            as='h1'
            className='text-white text-2xl font-semibold drop-shadow-lg'
            maxLines={1}
          >
            {event.name}
          </TextEllipsis>
        </div>
      </div>

      {/* Desktop Image */}
      <div className='hidden md:block container mx-auto py-6'>
        <img
          key={`${src}-desktop`}
          src={src}
          alt={event.name}
          decoding='async'
          loading='eager'
          className='rounded-lg transition-opacity duration-300 max-h-[480px] w-full object-contain'
        />
      </div>

      <div className='container mx-auto px-4 md:px-0 py-4 md:py-6 flex flex-col gap-6'>
        {/*
          Mobile (flex-col): Details(1) → InfoCards(2) → Tickets(3) → Map(4) → Description(5)
          Desktop (grid-cols-2): Left col (Details, Map, Description) | Right col (InfoCards, Tickets)

          `contents` on column wrappers makes children participate directly in the
          parent flex on mobile (respecting order-*), while on desktop the wrappers
          become flex columns that flow independently — no rigid grid rows, no whitespace.
        */}
        <div className='flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-10'>
          {/* Left column */}
          <div className='contents md:flex md:flex-col md:gap-6'>
            <div className='order-1 md:order-0'>
              <EventDetails
                name={event.name}
                eventStartDate={event.eventStartDate}
                eventEndDate={event.eventEndDate}
                venueName={event.venueName}
                venueAddress={event.venueAddress}
                onAddressClick={
                  hasCoordinates ? () => setMapExpanded(true) : undefined
                }
              />
            </div>
            {hasCoordinates && (
              <div className='order-4 md:order-0'>
                <VenueMapLazy
                  latitude={lat}
                  longitude={lng}
                  venueName={event.venueName}
                  venueAddress={event.venueAddress}
                  expanded={mapExpanded}
                  onExpandedChange={setMapExpanded}
                />
              </div>
            )}
            <div className='order-5 md:order-0'>
              <EventDescription
                description={event.description}
                externalUrl={event.externalUrl}
              />
            </div>
          </div>

          {/* Right column */}
          <div className='contents md:flex md:flex-col md:gap-6'>
            <div className='order-2'>
              <EventInfoCards
                qrAvailabilityTiming={event.qrAvailabilityTiming}
              />
            </div>
            <div className='order-3 flex flex-col gap-4'>
              <TicketSelection
                ticketWaves={event.ticketWaves}
                eventId={params.eventId}
                userListingsCount={event.userListingsCount}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
