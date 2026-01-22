import {useQuery} from '@tanstack/react-query';
import {Link} from '@tanstack/react-router';
import {getTrendingEventsQuery} from '~/lib';
import {Flame} from 'lucide-react';
import {Separator} from '~/components/ui/separator';
import {formatDate} from '~/utils/string';
import {Skeleton} from '~/components/ui/skeleton';

const TrendingEventCard = ({
  event,
}: {
  event: {
    id: string;
    name: string;
    eventStartDate: string;
    eventImages: {url: string; imageType: string}[];
    venue: {name: string; city: string} | null;
    totalViews: number;
  };
}) => {
  const flyerImage =
    event.eventImages.find(img => img.imageType === 'flyer') ||
    event.eventImages[0];

  return (
    <Link
      to='/eventos/$eventId'
      params={{eventId: event.id}}
      className='group flex flex-col overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md'
    >
      <div className='relative aspect-[4/3] overflow-hidden'>
        {flyerImage ? (
          <img
            src={flyerImage.url}
            alt={event.name}
            className='h-full w-full object-cover transition-transform group-hover:scale-105'
            loading='lazy'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-muted'>
            <span className='text-muted-foreground'>Sin imagen</span>
          </div>
        )}
        {/* Views badge */}
        <div className='absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white'>
          <Flame className='h-3 w-3 text-orange-400' />
          <span>{event.totalViews}</span>
        </div>
      </div>
      <div className='flex flex-col gap-1 p-3'>
        <h3 className='line-clamp-2 text-sm font-semibold leading-tight group-hover:text-primary'>
          {event.name}
        </h3>
        <p className='text-xs text-muted-foreground'>
          {formatDate(event.eventStartDate)}
        </p>
        {event.venue && (
          <p className='text-xs text-muted-foreground'>
            {event.venue.name} · {event.venue.city}
          </p>
        )}
      </div>
    </Link>
  );
};

const TrendingEventSkeleton = () => (
  <div className='flex flex-col overflow-hidden rounded-lg border bg-card'>
    <Skeleton className='aspect-[4/3]' />
    <div className='flex flex-col gap-2 p-3'>
      <Skeleton className='h-4 w-3/4' />
      <Skeleton className='h-3 w-1/2' />
      <Skeleton className='h-3 w-2/3' />
    </div>
  </div>
);

export const TrendingEvents = () => {
  const {data: events, isLoading} = useQuery(getTrendingEventsQuery(7, 6));

  // Don't render if no trending events
  if (!isLoading && (!events || events.length === 0)) {
    return null;
  }

  return (
    <section className='mx-auto flex flex-col gap-4 my-4 sm:my-6 max-w-6xl px-4 sm:px-0'>
      <div className='flex items-center gap-2'>
        <Flame className='h-5 w-5 text-orange-500' />
        <h2 className='text-lg sm:text-2xl font-bold'>Trending esta semana</h2>
      </div>
      <Separator />
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4'>
        {isLoading
          ? Array.from({length: 6}).map((_, i) => (
              <TrendingEventSkeleton key={`trending-skeleton-${i}`} />
            ))
          : events?.map(event => (
              <TrendingEventCard key={event.id} event={event} />
            ))}
      </div>
    </section>
  );
};
