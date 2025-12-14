import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {Calendar, Clock, MapPin} from 'lucide-react';
import {formatEventDate} from '~/utils/string';

interface EventDetailsSectionProps {
  startDate: Date;
  endDate: Date;
  venueName: string | null;
  venueAddress: string;
}

export function EventDetailsSection({
  startDate,
  endDate,
  venueName,
  venueAddress,
}: EventDetailsSectionProps) {
  return (
    <AccordionItem value='event' className='border-none'>
      <AccordionTrigger className='py-2 text-sm font-medium hover:no-underline'>
        <div className='flex items-center gap-2'>
          <Calendar className='h-4 w-4' />
          Detalles del evento
        </div>
      </AccordionTrigger>
      <AccordionContent className='space-y-3 pl-6 text-sm'>
        <div className='space-y-2'>
          <div className='flex items-start gap-2'>
            <Clock className='h-4 w-4 text-muted-foreground mt-0.5' />
            <div>
              <p className='font-medium'>Fecha y hora</p>
              <p className='text-muted-foreground'>{formatEventDate(startDate)}</p>
              {endDate && endDate.getTime() !== startDate.getTime() && (
                <p className='text-muted-foreground'>
                  Hasta: {formatEventDate(endDate)}
                </p>
              )}
            </div>
          </div>
          {venueName && (
            <div className='flex items-start gap-2'>
              <MapPin className='h-4 w-4 text-muted-foreground mt-0.5' />
              <div>
                <p className='font-medium'>{venueName}</p>
                <p className='text-muted-foreground'>{venueAddress}</p>
              </div>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

