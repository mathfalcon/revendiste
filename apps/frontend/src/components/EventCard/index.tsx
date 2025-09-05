import {Button} from '../ui/button';
import {format} from 'date-fns';
import {es} from 'date-fns/locale';
import {getCurrencySymbol} from '~/utils';
import {Link} from '@tanstack/react-router';
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
  startPrice: number;
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

  return (
    <article className='w-[300px] h-full p-2.5 bg-background shadow-sm rounded-lg hover:bg-accent transition-colors duration-300 cursor-pointer'>
      <Link
        to='/eventos/$eventId'
        params={{eventId: id}}
        className='flex flex-col gap-3'
      >
        <img
          src={imageUrl}
          alt={name}
          className='w-full h-[280px] rounded-lg bg-slate-800 object-cover'
        />
        <div className='flex flex-col gap-2.5'>
          <div className='flex flex-col justify-between gap-1'>
            <h3
              className='text-primary text-md whitespace-nowrap overflow-hidden text-ellipsis'
              title={name}
            >
              {name}
            </h3>
            <div className='flex items-center gap-2 text-xs'>
              <Calendar className='w-4 h-4' />
              <span className='capitalize'>
                {format(new Date(date), 'EEEE dd MMMM yyyy', {locale: es})}
              </span>
            </div>
          </div>
          <TextEllipsis
            className={`text-xs overflow-hidden text-ellipsis h-[3.75rem] max-h-[3.75rem] ${description ? '' : 'text-muted-foreground'}`}
            maxLines={4}
          >
            {description ?? 'Sin descripción'}
          </TextEllipsis>
        </div>
        <div className='flex flex-col gap-2'>
          <Separator />
          <div className='opacity-70 flex text-xs items-center gap-2'>
            <MapPin className='w-5 h-5' />
            {venueName}
          </div>
          <Separator />
        </div>
        <div className='flex justify-between items-center'>
          <p className='text-xs'>
            Desde:{' '}
            <span className='text-primary'>
              {getCurrencySymbol(currency)}
              {startPrice}
            </span>
          </p>
          <Button className='bg-primary-gradient'>Comprar</Button>
        </div>
      </Link>
    </article>
  );
};

export * from './SkeletonEventCard';
