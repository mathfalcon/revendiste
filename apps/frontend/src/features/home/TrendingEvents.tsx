import {useQuery} from '@tanstack/react-query';
import {Link, useNavigate} from '@tanstack/react-router';
import {EventTicketCurrency, getTrendingEventsQuery} from '~/lib';
import {Flame, TrendingUp} from 'lucide-react';
import {Separator} from '~/components/ui/separator';
import {formatDate} from '~/utils/string';
import {Skeleton} from '~/components/ui/skeleton';
import {useCallback, useEffect, useRef, useState} from 'react';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '~/components/ui/carousel';
import {TextEllipsis} from '~/components/ui/text-ellipsis';
import {Button} from '~/components/ui/button';
import {getCurrencySymbol, getEventDisplayImage} from '~/utils';
import {cn} from '~/lib/utils';

type TrendingEvent = {
  id: string;
  slug: string;
  name: string;
  eventStartDate: string;
  eventImages: {url: string; imageType: string; thumbnailUrl?: string}[];
  venue: {name: string; city: string} | null;
  totalViews: number;
  lowestAvailableTicketPrice: number | null;
  lowestAvailableTicketCurrency: string | null;
};

const TrendingEventCard = ({event}: {event: TrendingEvent}) => {
  const navigate = useNavigate();
  const primaryImage = getEventDisplayImage(event.eventImages);

  const hasTickets = event.lowestAvailableTicketPrice !== null;
  const currency =
    (event.lowestAvailableTicketCurrency as EventTicketCurrency) ||
    EventTicketCurrency.UYU;

  const handleButtonClick = (e: React.MouseEvent) => {
    if (!hasTickets) {
      e.preventDefault();
      e.stopPropagation();
      navigate({
        to: '/entradas/publicar',
        search: {eventoId: event.id},
      });
    }
  };

  return (
    <Link
      to='/eventos/$slug'
      params={{slug: event.slug}}
      preloadDelay={0}
      className='group flex h-28 sm:h-36 overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md'
    >
      {/* Image - Left side */}
      <div className='relative w-28 sm:w-36 h-full overflow-hidden flex-shrink-0'>
        {primaryImage ? (
          <img
            src={primaryImage.thumbnailUrl || primaryImage.url}
            alt={event.name}
            width={144}
            height={144}
            className='h-full w-full object-cover transition-transform group-hover:scale-105'
            loading='lazy'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-muted'>
            <span className='text-xs text-muted-foreground'>Sin imagen</span>
          </div>
        )}
      </div>

      {/* Content - Right side */}
      <div className='flex flex-1 flex-col justify-between p-3 min-w-0'>
        <div className='flex flex-col gap-0.5'>
          <TextEllipsis
            className='text-sm font-semibold leading-tight group-hover:text-primary'
            maxLines={1}
          >
            {event.name}
          </TextEllipsis>
          <p className='text-xs text-muted-foreground'>
            {formatDate(event.eventStartDate)}
          </p>
          {event.venue && (
            <p className='text-xs text-muted-foreground truncate'>
              {event.venue.city}
            </p>
          )}
        </div>

        {/* Price and CTA */}
        <div className='flex items-center justify-between gap-2'>
          {hasTickets ? (
            <p className='text-xs whitespace-nowrap'>
              Desde:{' '}
              <span className='text-primary font-medium'>
                {getCurrencySymbol(currency)}
                {event.lowestAvailableTicketPrice}
              </span>
            </p>
          ) : (
            <p className='text-xs text-muted-foreground whitespace-nowrap'>
              Sin publicaciones
            </p>
          )}
          <Button
            variant={hasTickets ? 'default' : 'outline'}
            className={cn('cursor-pointer', hasTickets ? 'bg-primary-gradient' : '')}
            size='sm'
            onClick={handleButtonClick}
          >
            {hasTickets ? 'Comprar' : 'Publicar'}
          </Button>
        </div>
      </div>
    </Link>
  );
};

const TrendingEventSkeleton = () => (
  <div className='flex h-28 sm:h-36 overflow-hidden rounded-lg border bg-card'>
    <Skeleton className='w-28 sm:w-36 h-full flex-shrink-0' />
    <div className='flex flex-1 flex-col justify-between p-3'>
      <div className='flex flex-col gap-2'>
        <Skeleton className='h-4 w-3/4' />
        <Skeleton className='h-3 w-1/2' />
        <Skeleton className='h-3 w-1/3' />
      </div>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-3 w-16' />
        <Skeleton className='h-8 w-20 rounded-md' />
      </div>
    </div>
  </div>
);

export const TrendingEvents = () => {
  const {data: events, isLoading} = useQuery(
    getTrendingEventsQuery(7, 6),
  );
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const autoplayPlugin = useRef(
    Autoplay({
      delay: 3000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  );

  const updateCarouselState = useCallback(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;

    updateCarouselState();

    api.on('select', updateCarouselState);
    api.on('reInit', updateCarouselState);

    return () => {
      api.off('select', updateCarouselState);
      api.off('reInit', updateCarouselState);
    };
  }, [api, updateCarouselState]);

  // Don't render if no trending events
  if (!isLoading && (!events || events.length === 0)) {
    return null;
  }

  return (
    <section className='mx-auto flex flex-col gap-4 my-4 sm:my-6 w-full sm:w-[624px] lg:w-[948px] px-4 sm:px-0 overflow-hidden'>
      <div className='flex items-center gap-2'>
        <TrendingUp className='h-5 w-5 text-primary' />
        <h2 className='text-lg sm:text-2xl font-bold'>Trending esta semana</h2>
      </div>
      <Separator />

      {isLoading ? (
        <div className='flex flex-col gap-3'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <TrendingEventSkeleton />
            <div className='hidden lg:block'>
              <TrendingEventSkeleton />
            </div>
          </div>
          <div className='h-1.5' />
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          <Carousel
            opts={{
              align: 'start',
              loop: true,
              slidesToScroll: 'auto',
            }}
            plugins={[autoplayPlugin.current]}
            setApi={setApi}
            className='w-full'
          >
            <CarouselContent className='-ml-4'>
              {events?.map(event => (
                <CarouselItem
                  key={event.id}
                  className='pl-4 basis-full lg:basis-1/2'
                >
                  <TrendingEventCard
                    event={event as unknown as TrendingEvent}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Progress bars */}
          <div className='flex justify-center gap-1.5'>
            {Array.from({length: count}).map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300 cursor-pointer',
                  current === index
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50',
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
