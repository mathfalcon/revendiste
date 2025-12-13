import {Link} from '@tanstack/react-router';
import {CardDescription, CardHeader, CardTitle} from '~/components/ui/card';

interface ListingCardHeaderProps {
  eventName: string;
  eventId: string;
  ticketWaveName: string;
}

export function ListingCardHeader({
  eventName,
  eventId,
  ticketWaveName,
}: ListingCardHeaderProps) {
  return (
    <CardHeader>
      <div className='space-y-1'>
        <CardTitle className='text-xl'>
          <Link
            to='/eventos/$eventId'
            params={{eventId}}
            className='hover:text-primary transition-colors'
          >
            {eventName}
          </Link>
        </CardTitle>
        <CardDescription className='text-base'>{ticketWaveName}</CardDescription>
      </div>
    </CardHeader>
  );
}

