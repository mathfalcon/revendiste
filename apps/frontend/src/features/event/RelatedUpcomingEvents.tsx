import {Link} from '@tanstack/react-router';
import {formatDate} from '~/utils/string';
import {getEventDisplayImage} from '~/utils';
import {CDN_ASSETS} from '~/assets';

type RelatedEvent = {
  id: string;
  slug: string;
  name: string;
  eventStartDate: string;
  eventEndDate: string;
  venueName: string | null;
  venueCity: string | null;
  images: {
    imageType: string;
    url: string;
    thumbnailUrl?: string | null;
  }[];
};

interface RelatedUpcomingEventsProps {
  events: RelatedEvent[];
}

export function RelatedUpcomingEvents({events}: RelatedUpcomingEventsProps) {
  if (events.length === 0) return null;

  return (
    <section className='flex flex-col gap-4'>
      <h2 className='text-lg font-semibold'>Próximos eventos</h2>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
        {events.map(event => {
          const image = getEventDisplayImage(event.images);
          const imgSrc =
            image?.thumbnailUrl ?? image?.url ?? CDN_ASSETS.SQUARE_LOGO;

          return (
            <Link
              key={event.id}
              to='/eventos/$slug'
              params={{slug: event.slug}}
              className='flex items-center gap-3 rounded-lg border bg-card p-3 hover:bg-muted/50 transition-colors'
            >
              <img
                src={imgSrc}
                alt={event.name}
                width={56}
                height={56}
                className='h-14 w-14 rounded-md object-cover shrink-0'
                loading='lazy'
              />
              <div className='flex flex-col gap-0.5 min-w-0'>
                <p className='text-sm font-medium leading-tight line-clamp-2'>
                  {event.name}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {formatDate(event.eventStartDate)}
                </p>
                {event.venueName && (
                  <p className='text-xs text-muted-foreground truncate'>
                    {event.venueName}
                    {event.venueCity ? `, ${event.venueCity}` : ''}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
