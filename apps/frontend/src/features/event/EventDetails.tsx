import {format} from 'date-fns';
import {es} from 'date-fns/locale';
import {CalendarFilled, MapPinFilled} from '~/assets';
import {GetEventByIdResponse} from '~/lib';
import {formatEventDate} from '~/utils/string';

type EventDetailsProps = Pick<
  GetEventByIdResponse,
  'name' | 'eventStartDate' | 'eventEndDate' | 'venueName' | 'venueAddress'
>;

export const EventDetails = (props: EventDetailsProps) => {
  const {name, eventStartDate, eventEndDate, venueName, venueAddress} = props;

  const startDate = new Date(eventStartDate);
  const endDate = eventEndDate ? new Date(eventEndDate) : null;
  const isSameDay =
    endDate && startDate.toDateString() === endDate.toDateString();

  return (
    <div className='flex flex-col gap-4'>
      <h1 className='hidden md:block text-primary text-xl font-semibold'>
        {name}
      </h1>
      <div className='flex flex-col md:flex-row md:items-center gap-4 md:gap-8 flex-wrap'>
        <div className='flex flex-col gap-1 flex-shrink-0'>
          <div className='flex items-center gap-2'>
            <CalendarFilled className='w-5 h-5 md:w-6 md:h-6' />
            <span className='text-sm md:text-base'>
              {formatEventDate(startDate)}
            </span>
          </div>
          {endDate && !isSameDay && (
            <div className='flex items-center gap-2 ml-7'>
              <span className='text-sm md:text-base text-muted-foreground'>
                Hasta: {formatEventDate(endDate)}
              </span>
            </div>
          )}
          {endDate && isSameDay && (
            <div className='flex items-center gap-2 ml-7'>
              <span className='text-sm md:text-base text-muted-foreground'>
                Hasta: {format(endDate, 'HH:mm', {locale: es})}
              </span>
            </div>
          )}
        </div>
        <div className='flex items-start gap-2'>
          <MapPinFilled className='w-5 h-5 md:w-6 md:h-6 flex-shrink-0 mt-0.5' />
          <span className='text-sm md:text-base'>
            {venueName ? `${venueName} - ${venueAddress}` : venueAddress}
          </span>
        </div>
      </div>
    </div>
  );
};
