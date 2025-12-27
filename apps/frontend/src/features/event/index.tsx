import {useSuspenseQuery} from '@tanstack/react-query';
import {EventLeftSide} from './EventLeftSide';
import {EventRightSide} from './EventRightSide';
import {EventImageType, getEventByIdQuery} from '~/lib';
import {useParams} from '@tanstack/react-router';
import defaultHeroImage from '~/assets/backgrounds/homepage.png?url';
import {useEffect, useRef, useState} from 'react';
import {FullScreenLoading, TextEllipsis} from '~/components';

export const EventPage = () => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const params = useParams({from: '/eventos/$eventId'});
  const response = useSuspenseQuery(getEventByIdQuery(params.eventId));

  const event = response.data;
  const heroImage = event.eventImages.find(
    i => i.imageType === EventImageType.Hero,
  );
  const src = heroImage?.url ?? defaultHeroImage;

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
        <div className='flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-10'>
          <div className='order-1'>
            <EventLeftSide
              name={event.name}
              description={event.description}
              eventStartDate={event.eventStartDate}
              eventEndDate={event.eventEndDate}
              venueName={event.venueName}
              venueAddress={event.venueAddress}
            />
          </div>
          <div className='order-2'>
            <EventRightSide
              ticketWaves={event.ticketWaves}
              eventId={params.eventId}
            />
          </div>
        </div>
      </div>
    </>
  );
};
