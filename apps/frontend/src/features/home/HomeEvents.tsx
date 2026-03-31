import {useMemo, useRef} from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {EventCard, SkeletonEventCard} from '~/components';
import {Separator} from '~/components/ui/separator';
import {useInfiniteScroll} from '~/hooks';
import {
  EventImageType,
  EventTicketCurrency,
  getEventsInfiniteQuery,
} from '~/lib';
import {LocationFilterBar, type LocationFilter} from './LocationFilter';
import {CDN_ASSETS} from '~/assets';

interface HomeEventsProps {
  locationFilter: LocationFilter;
  onLocationChange: (filter: LocationFilter) => void;
}

export const HomeEvents = ({
  locationFilter,
  onLocationChange,
}: HomeEventsProps) => {
  const filters = useMemo(() => {
    const f: Record<string, string | number | boolean> = {};

    if (locationFilter.type === 'nearby' && locationFilter.lat && locationFilter.lng) {
      f.lat = locationFilter.lat;
      f.lng = locationFilter.lng;
    } else if (locationFilter.type === 'region' && locationFilter.regions?.length) {
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

  const {data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage} =
    useInfiniteQuery(getEventsInfiniteQuery(20, filters));

  // Flatten all pages into a single array
  const events = data?.pages.flatMap(page => page.data) ?? [];

  // Use the infinite scroll hook
  const sentinelRef = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  });

  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <div className='mx-auto flex flex-col gap-4 my-4 sm:my-6 w-full sm:w-[624px] lg:w-[948px] px-4 sm:px-0'>
      <div ref={sectionRef} className='flex flex-col gap-3 scroll-mt-(--navbar-height,64px)'>
        <h2 className='text-lg sm:text-2xl font-bold text-center sm:text-left'>
          Encontrá tu próximo evento
        </h2>
        <LocationFilterBar
          value={locationFilter}
          onChange={onLocationChange}
          scrollTargetRef={sectionRef}
        />
      </div>
      <Separator />
      <main className='grid w-full min-w-0 gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
        {isLoading
          ? Array.from({length: 6}).map((_, index) => (
              <SkeletonEventCard key={`event-card-skeleton-${index}`} />
            ))
          : events.map(event => {
              const eventImages = event.images;

              // Prefer flyer image, fall back to hero if not available
              const flyerImage =
                eventImages.find(
                  image => image.imageType === EventImageType.Flyer,
                ) ??
                eventImages.find(
                  image => image.imageType === EventImageType.Hero,
                );

              // Get lowest available ticket price and currency
              const eventWithPrice = event as typeof event & {
                lowestAvailableTicketPrice?: number | null;
                lowestAvailableTicketCurrency?: EventTicketCurrency | null;
              };

              const lowestPrice = (eventWithPrice.lowestAvailableTicketPrice ??
                null) as number | null;
              const currency: EventTicketCurrency =
                (eventWithPrice.lowestAvailableTicketCurrency as
                  | EventTicketCurrency
                  | undefined) ?? EventTicketCurrency.UYU;

              return (
                <EventCard
                  key={event.id}
                  id={event.id}
                  slug={event.slug}
                  name={event.name}
                  imageUrl={flyerImage?.url ?? CDN_ASSETS.SQUARE_LOGO}
                  date={event.eventStartDate}
                  description={event.description}
                  venueName={event.venueName}
                  startPrice={lowestPrice as number | null}
                  currency={currency}
                />
              );
            })}
        {/* Empty state */}
        {!isLoading && events.length === 0 && (
          <div className='col-span-full text-center py-12 text-muted-foreground'>
            <p className='text-lg font-medium'>
              {locationFilter.type !== 'all'
                ? 'No hay eventos en esta zona'
                : locationFilter.hasTickets
                  ? 'No hay eventos con entradas disponibles'
                  : locationFilter.dateFrom
                    ? 'No hay eventos en estas fechas'
                    : 'No hay eventos disponibles'}
            </p>
            <p className='text-sm mt-1'>
              {locationFilter.type !== 'all'
                ? 'Probá con otra ubicación o explorá todos los eventos'
                : locationFilter.hasTickets || locationFilter.dateFrom
                  ? 'Probá cambiando los filtros o explorá todos los eventos'
                  : 'Volvé pronto, estamos agregando nuevos eventos'}
            </p>
          </div>
        )}
        {/* Show skeletons while loading next page */}
        {isFetchingNextPage &&
          Array.from({length: 3}).map((_, index) => (
            <SkeletonEventCard key={`loading-next-page-${index}`} />
          ))}
        {/* Sentinel element for infinite scroll */}
        {hasNextPage && (
          <div ref={sentinelRef} className='col-span-full' aria-hidden='true' />
        )}
      </main>
    </div>
  );
};
