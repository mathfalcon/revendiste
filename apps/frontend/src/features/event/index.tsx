import {useSuspenseQuery} from '@tanstack/react-query';
import {EventLeftSide} from './EventLeftSide';
import {EventRightSide} from './EventRightSide';
import {EventImageType, getEventByIdQuery} from '~/lib';
import {useParams} from '@tanstack/react-router';
import defaultHeroImage from '~/assets/backgrounds/homepage.png?url';

export const EventPage = () => {
  const params = useParams({from: '/eventos/$eventId'});
  const response = useSuspenseQuery(getEventByIdQuery(params.eventId));

  if (response.error) {
    return <div>Error</div>;
  }

  const event = response.data;

  const heroImage = event.eventImages.find(
    image => image.imageType === EventImageType.Hero,
  );

  return (
    <div className='container mx-auto py-6 flex flex-col gap-6'>
      <img
        src={heroImage?.url ?? defaultHeroImage}
        alt='event'
        className='rounded-lg h-full w-auto max-h-[465px]'
      />

      <div className='grid grid-cols-2 gap-10'>
        <EventLeftSide
          name={event.name}
          description={event.description}
          eventStartDate={event.eventStartDate}
          venueName={event.venueName}
          venueAddress={event.venueAddress}
        />
        <EventRightSide ticketWaves={event.ticketWaves} />
      </div>
    </div>
  );
};
