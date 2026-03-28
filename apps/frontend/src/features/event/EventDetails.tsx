import {format} from 'date-fns';
import {es} from 'date-fns/locale';
import {CalendarFilled, MapPinFilled} from '~/assets';
import {GetEventByIdResponse} from '~/lib';
import {formatEventDate} from '~/utils/string';
import {TextEllipsis} from '~/components';

type EventDetailsProps = Pick<
  GetEventByIdResponse,
  'name' | 'eventStartDate' | 'eventEndDate' | 'venueName' | 'venueAddress'
> & {
  onAddressClick?: () => void;
};

export const EventDetails = (props: EventDetailsProps) => {
  const {
    name,
    eventStartDate,
    eventEndDate,
    venueName,
    venueAddress,
    onAddressClick,
  } = props;

  const startDate = new Date(eventStartDate);
  const endDate = eventEndDate ? new Date(eventEndDate) : null;
  const isSameDay =
    endDate && startDate.toDateString() === endDate.toDateString();

  const addressText = venueName
    ? `${venueName} - ${venueAddress}`
    : venueAddress;

  return (
    <div className='flex flex-col gap-4'>
      <h1 className='hidden md:block text-foreground text-2xl font-semibold'>
        {name}
      </h1>
      <div className='flex flex-col md:flex-row md:items-center gap-4 md:gap-8 flex-wrap'>
        <div className='flex flex-col gap-1 shrink-0'>
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
        <button
          type='button'
          onClick={onAddressClick}
          disabled={!onAddressClick}
          className='flex items-start gap-2 text-left min-w-0 max-w-full overflow-hidden hover:underline disabled:hover:no-underline disabled:cursor-default'
        >
          <MapPinFilled className='w-5 h-5 md:w-6 md:h-6 shrink-0 mt-0.5' />
          <TextEllipsis className='text-sm md:text-base' maxLines={1}>
            {addressText}
          </TextEllipsis>
        </button>
      </div>
    </div>
  );
};
