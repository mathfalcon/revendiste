import {useRef} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useMemo} from 'react';
import {EventCard, SkeletonEventCard} from '~/components';
import {getEventDisplayImage} from '~/utils';
import {Separator} from '~/components/ui/separator';
import {EventTicketCurrency, getEventsPaginatedQuery} from '~/lib';
import {
  LocationFilterBar,
  type LocationFilter,
} from '~/features/home/LocationFilter';
import {CDN_ASSETS} from '~/assets';

interface EventListingPageProps {
  heading: string;
  description?: string;
  locationFilter: LocationFilter;
  onLocationChange: (filter: LocationFilter) => void;
}

export const EventListingPage = ({
  heading,
  description,
  locationFilter,
  onLocationChange,
}: EventListingPageProps) => {
  const filters = useMemo(() => {
    const f: Record<string, string | number | boolean> = {};

    if (
      locationFilter.type === 'nearby' &&
      locationFilter.lat &&
      locationFilter.lng
    ) {
      f.lat = locationFilter.lat;
      f.lng = locationFilter.lng;
    } else if (
      locationFilter.type === 'region' &&
      locationFilter.regions?.length
    ) {
      f.region = locationFilter.regions.join(',');
    }

    if (locationFilter.dateFrom) f.dateFrom = locationFilter.dateFrom;
    if (locationFilter.dateTo) f.dateTo = locationFilter.dateTo;
    if (locationFilter.hasTickets) f.hasTickets = true;
    if (locationFilter.dateFrom || locationFilter.dateTo) {
      f.tzOffset = new Date().getTimezoneOffset();
    }

    return f;
  }, [locationFilter]);

  const {data, isLoading} = useQuery(
    getEventsPaginatedQuery({limit: 100, page: 1}, filters),
  );

  const events = data?.data ?? [];

  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <div className='mx-auto flex flex-col gap-4 my-4 sm:my-6 w-full sm:w-[624px] lg:w-[948px] px-4 sm:px-0'>
      <div
        ref={sectionRef}
        className='flex flex-col gap-3 scroll-mt-(--navbar-height,64px)'
      >
        <h1 className='text-xl sm:text-3xl font-bold text-center sm:text-left'>
          {heading}
        </h1>
        {description && (
          <p className='text-sm sm:text-base text-muted-foreground text-center sm:text-left'>
            {description}
          </p>
        )}
        <LocationFilterBar
          value={locationFilter}
          onChange={onLocationChange}
          scrollTargetRef={sectionRef}
        />
      </div>
      <Separator />
      <div className='grid w-full min-w-0 gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
        {isLoading
          ? Array.from({length: 6}).map((_, index) => (
              <SkeletonEventCard key={`event-card-skeleton-${index}`} />
            ))
          : events.map(event => {
              const primaryImage = getEventDisplayImage(event.images);

              const eventWithPrice = event as typeof event & {
                lowestAvailableTicketPrice?: number | null;
                lowestAvailableTicketCurrency?: EventTicketCurrency | null;
              };

              return (
                <EventCard
                  key={event.id}
                  id={event.id}
                  slug={event.slug}
                  name={event.name}
                  imageUrl={primaryImage?.url ?? CDN_ASSETS.SQUARE_LOGO}
                  thumbnailUrl={primaryImage?.thumbnailUrl}
                  date={event.eventStartDate}
                  description={event.description}
                  venueName={event.venueName}
                  startPrice={
                    (eventWithPrice.lowestAvailableTicketPrice ?? null) as
                      | number
                      | null
                  }
                  currency={
                    (eventWithPrice.lowestAvailableTicketCurrency as
                      | EventTicketCurrency
                      | undefined) ?? EventTicketCurrency.UYU
                  }
                />
              );
            })}
        {!isLoading && events.length === 0 && (
          <div className='col-span-full text-center py-12 text-muted-foreground'>
            <p className='text-lg font-medium'>No hay eventos disponibles</p>
            <p className='text-sm mt-1'>
              Probá cambiando los filtros o explorá todos los eventos
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
