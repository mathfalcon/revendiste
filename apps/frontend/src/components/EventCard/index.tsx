import {Button} from '../ui/button';
import {format} from 'date-fns';
import {es} from 'date-fns/locale';
import {getCurrencySymbol} from '~/utils';
import {Link, useNavigate} from '@tanstack/react-router';
import {Separator} from '../ui/separator';
import {Calendar, MapPin} from '~/assets';
import {TextEllipsis} from '../ui/text-ellipsis';
import {EventTicketCurrency} from '~/lib';

type EventCardProps = {
  id: string;
  imageUrl?: string;
  name: string;
  date: string;
  description: string | null;
  venueName: string | null;
  startPrice: number | null;
  currency: EventTicketCurrency;
};

export const EventCard = (props: EventCardProps) => {
  const {
    id,
    imageUrl,
    name,
    date,
    description,
    venueName,
    startPrice,
    currency,
  } = props;

  const navigate = useNavigate();
  const hasTickets = startPrice !== null;

  const handleButtonClick = (e: React.MouseEvent) => {
    if (!hasTickets) {
      e.preventDefault();
      e.stopPropagation();
      navigate({
        to: '/entradas/publicar',
        search: {eventoId: id},
      });
    }
  };

  return (
    <article className='w-full sm:w-[300px] sm:h-[524px] p-2 sm:p-2.5 bg-background shadow-sm rounded-lg hover:bg-accent transition-colors duration-300 cursor-pointer'>
      <Link
        to='/eventos/$eventId'
        params={{eventId: id}}
        className='flex flex-col h-full sm:justify-between sm:gap-3'
      >
        {/* Mobile: Image and Info side by side | Desktop: Image on top */}
        <div className='flex flex-row sm:flex-col gap-2 sm:gap-3'>
          {/* Image */}
          <img
            src={imageUrl}
            alt={name}
            className='w-24 h-24 sm:w-full sm:h-[280px] rounded-lg bg-slate-800 object-cover shrink-0'
          />

          {/* Info section */}
          <div className='flex flex-col flex-1 min-w-0 gap-1 sm:gap-2.5'>
            {/* Title - 1 line with ellipsis */}
            <div title={name}>
              <TextEllipsis
                className='text-primary text-sm sm:text-md'
                maxLines={1}
              >
                {name}
              </TextEllipsis>
            </div>

            {/* Date */}
            <div className='opacity-70 flex items-center gap-1.5 text-xs shrink-0'>
              <Calendar className='w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0' />
              <span className='capitalize truncate'>
                {format(new Date(date), 'EEEE dd MMMM yyyy', {locale: es})}
              </span>
            </div>

            {/* Location - hidden on desktop, shown on mobile */}
            <div className='opacity-70 flex text-xs items-center gap-1.5 shrink-0 sm:hidden'>
              <MapPin className='w-3.5 h-3.5 shrink-0' />
              <span className='truncate'>{venueName}</span>
            </div>

            {/* Description - 2 lines on mobile */}
            <div className='sm:hidden'>
              <TextEllipsis
                className={`text-[10px] ${description ? '' : 'text-muted-foreground'}`}
                maxLines={2}
              >
                {description ?? 'Sin descripción'}
              </TextEllipsis>
            </div>
            {/* Description - 4 lines on desktop */}
            <div className='hidden sm:block h-[64px]'>
              <TextEllipsis
                className={`text-xs ${description ? '' : 'text-muted-foreground'}`}
                maxLines={4}
              >
                {description ?? 'Sin descripción'}
              </TextEllipsis>
            </div>

            {/* Desktop: Separator and Venue section */}
            <div className='hidden sm:flex flex-col gap-2'>
              <Separator />
              <div className='opacity-70 flex text-xs items-center gap-2'>
                <MapPin className='w-5 h-5' />
                {venueName}
              </div>
              <Separator />
            </div>
          </div>
        </div>

        {/* Mobile: Full-width Separator */}
        <Separator className='my-2 sm:hidden' />

        {/* Price/Status and Button */}
        <div className='flex justify-between items-center gap-2'>
          {hasTickets ? (
            <p className='text-xs whitespace-nowrap'>
              Desde:{' '}
              <span className='text-primary'>
                {getCurrencySymbol(currency)}
                {startPrice}
              </span>
            </p>
          ) : (
            <p className='text-xs text-muted-foreground whitespace-nowrap'>
              Sin tickets
            </p>
          )}
          <Button
            variant={hasTickets ? 'default' : 'outline'}
            className={hasTickets ? 'bg-primary-gradient' : ''}
            size='sm'
            onClick={handleButtonClick}
          >
            {hasTickets ? 'Comprar' : 'Publicar'}
          </Button>
        </div>
      </Link>
    </article>
  );
};

export * from './SkeletonEventCard';
