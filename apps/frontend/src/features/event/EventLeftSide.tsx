import {format} from 'date-fns';
import {es} from 'date-fns/locale';
import {CalendarFilled, MapPinFilled} from '~/assets';
import {GetEventByIdResponse} from '~/lib';

type EventLeftSideProps = Pick<
  GetEventByIdResponse,
  'name' | 'eventStartDate' | 'venueName' | 'venueAddress' | 'description'
>;

export const EventLeftSide = (props: EventLeftSideProps) => {
  const {name, eventStartDate, venueName, venueAddress, description} = props;
  console.log(description);
  return (
    <div className='flex flex-col gap-8'>
      <div className='flex flex-col gap-4'>
        <h1 className='text-primary text-xl font-semibold'>{name}</h1>
        <div className='flex items-center gap-8'>
          <div className='flex items-center gap-2 flex-shrink-0'>
            <CalendarFilled className='w-6 h-6' />
            <span className='capitalize'>
              {format(new Date(eventStartDate), 'EEEE dd MMMM yyyy', {
                locale: es,
              })}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <MapPinFilled className='w-6 h-6 flex-shrink-0' />
            {venueName ? `${venueName} - ${venueAddress}` : venueAddress}
          </div>
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <h3 className='font-medium text-lg'>Descripción</h3>
        <p
          className={`opacity-75 text-sm ${description ? '' : 'text-muted-foreground'} whitespace-pre-line`}
          title={description ?? 'Sin descripción'}
        >
          {description ?? 'Sin descripción'}
        </p>
      </div>
    </div>
  );
};
