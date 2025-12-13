import {format} from 'date-fns';
import {es} from 'date-fns/locale';
import {CalendarFilled, MapPinFilled} from '~/assets';
import {GetEventByIdResponse} from '~/lib';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';

type EventLeftSideProps = Pick<
  GetEventByIdResponse,
  'name' | 'eventStartDate' | 'venueName' | 'venueAddress' | 'description'
>;

export const EventLeftSide = (props: EventLeftSideProps) => {
  const {name, eventStartDate, venueName, venueAddress, description} = props;

  return (
    <div className='flex flex-col gap-4 md:gap-8'>
      <div className='flex flex-col gap-4'>
        <h1 className='hidden md:block text-primary text-xl font-semibold'>
          {name}
        </h1>
        <div className='flex flex-col md:flex-row md:items-center gap-4 md:gap-8'>
          <div className='flex items-center gap-2 flex-shrink-0'>
            <CalendarFilled className='w-5 h-5 md:w-6 md:h-6' />
            <span className='capitalize text-sm md:text-base'>
              {format(new Date(eventStartDate), 'EEEE dd MMMM yyyy', {
                locale: es,
              })}
            </span>
          </div>
          <div className='flex items-start gap-2'>
            <MapPinFilled className='w-5 h-5 md:w-6 md:h-6 flex-shrink-0 mt-0.5' />
            <span className='text-sm md:text-base'>
              {venueName ? `${venueName} - ${venueAddress}` : venueAddress}
            </span>
          </div>
        </div>
      </div>
      <Accordion
        type='single'
        collapsible
        defaultValue={undefined}
        className='w-full'
      >
        <AccordionItem value='description' className='border-none'>
          <AccordionTrigger className='py-2 hover:no-underline'>
            <h3 className='font-medium text-base md:text-lg'>Descripción</h3>
          </AccordionTrigger>
          <AccordionContent className='pt-2'>
            <p
              className={`opacity-75 text-sm ${description ? '' : 'text-muted-foreground'} whitespace-pre-line`}
              title={description ?? 'Sin descripción'}
            >
              {description ?? 'Sin descripción'}
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
