import {useInfiniteQuery} from '@tanstack/react-query';
import {EventCard, SkeletonEventCard} from '~/components';
import {Separator} from '~/components/ui/separator';
import {useInfiniteScroll} from '~/hooks';
import {
  EventImageType,
  EventTicketCurrency,
  getEventsInfiniteQuery,
} from '~/lib';

export const HomeEvents = () => {
  const {data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage} =
    useInfiniteQuery(getEventsInfiniteQuery(20));

  // Flatten all pages into a single array
  const events = data?.pages.flatMap(page => page.data) ?? [];

  // Use the infinite scroll hook
  const sentinelRef = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  });

  return (
    <div className='mx-auto flex flex-col gap-4 my-4 sm:my-6'>
      <h2 className='text-lg sm:text-2xl font-bold text-center sm:text-left'>
        Encontrá tu próximo evento
      </h2>
      <Separator />
      <main className='grid gap-3 sm:gap-6 m-auto grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl px-4 sm:px-0'>
        {isLoading
          ? Array.from({length: 6}).map((_, index) => (
              <SkeletonEventCard key={`event-card-skeleton-${index}`} />
            ))
          : events.map(event => {
              const eventImages = event.images;

              const flyerImage = eventImages.find(
                image => image.imageType === EventImageType.Flyer,
              );

              // Get lowest available ticket price and currency
              // Type assertion needed until API types are regenerated
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
                  name={event.name}
                  imageUrl={flyerImage?.url}
                  date={event.eventStartDate}
                  description={event.description}
                  venueName={event.venueName}
                  startPrice={lowestPrice as number | null}
                  currency={currency}
                />
              );
            })}
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
