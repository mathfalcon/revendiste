import {useQuery} from '@tanstack/react-query';
import {EventCard, SkeletonEventCard} from '~/components';
import {Separator} from '~/components/ui/separator';
import {
  EventImageType,
  EventTicketCurrency,
  getEventsPaginatedQuery,
} from '~/lib';

export const HomeEvents = () => {
  const {data, isLoading} = useQuery(
    getEventsPaginatedQuery({limit: 20, page: 1}),
  );

  const events = data?.data ?? [];

  return (
    <div className='mx-auto flex flex-col gap-4 my-6'>
      <h2 className='text-2xl font-bold'>Encontrá tu próximo evento</h2>
      <Separator />
      <main className='grid gap-6 m-auto grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl'>
        {isLoading
          ? Array.from({length: 6}).map((_, index) => (
              <SkeletonEventCard key={`event-card-skeleton-${index}`} />
            ))
          : events.map(event => {
              const eventImages = event.images;

              const flyerImage = eventImages.find(
                image => image.imageType === EventImageType.Flyer,
              );

              return (
                <EventCard
                  key={event.id}
                  id={event.id}
                  name={event.name}
                  imageUrl={flyerImage?.url}
                  date={event.eventStartDate}
                  description={event.description}
                  venueName={event.venueName}
                  startPrice={800}
                  currency={EventTicketCurrency.UYU}
                />
              );
            })}
      </main>
    </div>
  );
};
