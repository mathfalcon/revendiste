import {useSuspenseQuery} from '@tanstack/react-query';
import {EventLeftSide} from './EventLeftSide';
import {EventRightSide} from './EventRightSide';
import {EventImageType, getEventByIdQuery} from '~/lib';
import {useParams} from '@tanstack/react-router';
import defaultHeroImage from '~/assets/backgrounds/homepage.png?url';
import {useEffect, useRef, useState} from 'react';
import {FullScreenLoading} from '~/components';

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

  // Handle cached images + when src changes
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
      <div className='container mx-auto py-6 flex flex-col gap-6'>
        <img
          key={src}
          ref={imgRef}
          src={src}
          alt='event'
          decoding='async'
          loading='eager'
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
          className='rounded-lg transition-opacity duration-300 max-h-[480px] w-full object-contain'
        />

        <div className='grid grid-cols-2 gap-10'>
          <EventLeftSide
            name={event.name}
            description={event.description}
            eventStartDate={event.eventStartDate}
            venueName={event.venueName}
            venueAddress={event.venueAddress}
          />
          <EventRightSide ticketWaves={event.ticketWaves} eventId={params.eventId} />
        </div>
      </div>
    </>
  );
};
