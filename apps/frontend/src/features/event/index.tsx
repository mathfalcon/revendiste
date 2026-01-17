import {useSuspenseQuery} from '@tanstack/react-query';
import {EventDetails} from './EventDetails';
import {EventDescription} from './EventDescription';
import {TicketSelection} from './tickets';
import {EventInfoCards} from './EventInfoCards';
import {EventImageType, getEventByIdQuery} from '~/lib';
import {useParams} from '@tanstack/react-router';
import {useEffect, useRef, useState} from 'react';
import {FullScreenLoading, TextEllipsis} from '~/components';
import {CDN_ASSETS} from '~/assets';

export const EventPage = () => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const params = useParams({from: '/eventos/$eventId'});
  const response = useSuspenseQuery(getEventByIdQuery(params.eventId));

  const event = response.data;
  const heroImage = event.eventImages.find(
    i => i.imageType === EventImageType.Hero,
  );
  const src = heroImage?.url ?? CDN_ASSETS.DEFAULT_OG_IMAGE;

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
        <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none' />

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
          Mobile order: Details (1) → Info Cards (2) → Tickets (3) → Description (4)
          Desktop: Two columns - Left (Details + Description), Right (Info Cards + Tickets)
        */}
        <div className='flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-10'>
          {/* Event Details - Always first */}
          <div className='order-1 md:row-span-2 flex flex-col gap-6'>
            <EventDetails
              name={event.name}
              eventStartDate={event.eventStartDate}
              eventEndDate={event.eventEndDate}
              venueName={event.venueName}
              venueAddress={event.venueAddress}
            />
            {/* Info Cards + Description - Desktop: shows here in left column */}
            <div className='hidden md:flex md:flex-col md:gap-4'>
              <EventInfoCards
                qrAvailabilityTiming={event.qrAvailabilityTiming}
              />
              <EventDescription
                description={event.description}
                externalUrl={event.externalUrl}
              />
            </div>
          </div>

          {/* Info Cards - Mobile only: shows after details */}
          <div className='order-2 md:hidden'>
            <EventInfoCards qrAvailabilityTiming={event.qrAvailabilityTiming} />
          </div>

          {/* Tickets Section */}
          <div className='order-3 md:order-2 flex flex-col gap-4'>
            <TicketSelection
              ticketWaves={event.ticketWaves}
              eventId={params.eventId}
            />
          </div>

          {/* Description - Mobile only: shows after tickets */}
          <div className='order-4 md:hidden'>
            <EventDescription
              description={event.description}
              externalUrl={event.externalUrl}
            />
          </div>
        </div>
      </div>
    </>
  );
};
