import {useNavigate} from '@tanstack/react-router';
import {type GetUserListingsResponse} from '~/lib/api/generated';
import {Card, CardContent} from '~/components/ui/card';
import {Accordion} from '~/components/ui/accordion';
import {ListingCardHeader} from './ListingCardHeader';
import {EventDetailsSection} from './EventDetailsSection';
import {ActiveTicketsSection} from './ActiveTicketsSection';
import {SoldTicketsSection} from './SoldTicketsSection';
import {CancelledTicketsSection} from './CancelledTicketsSection';

interface ListingCardProps {
  listing: GetUserListingsResponse[number];
}

export function ListingCard({listing}: ListingCardProps) {
  const {event, ticketWave, tickets} = listing;
  const navigate = useNavigate({from: '/cuenta/publicaciones'});

  const startDate = new Date(event.eventStartDate);
  const endDate = new Date(event.eventEndDate);

  const handleUploadClick = (ticketId: string) => {
    navigate({
      search: prev => ({
        ...prev,
        subirTicket: ticketId,
      }),
    });
  };

  // Filter tickets by status
  const activeTickets = tickets.filter(
    ticket => !ticket.cancelledAt && !ticket.soldAt,
  );
  const soldTickets = tickets.filter(ticket => ticket.soldAt);
  const cancelledTickets = tickets.filter(ticket => ticket.cancelledAt);

  return (
    <Card className='w-full'>
      <ListingCardHeader
        eventName={event.name}
        eventId={event.id}
        ticketWaveName={ticketWave.name}
      />

      <CardContent className='space-y-4'>
        <Accordion type='single' collapsible className='w-full'>
          <EventDetailsSection
            startDate={startDate}
            endDate={endDate}
            venueName={event.venueName}
            venueAddress={event.venueAddress}
          />

          <ActiveTicketsSection
            tickets={activeTickets}
            ticketWaveName={ticketWave.name}
            ticketWaveCurrency={ticketWave.currency}
            ticketWaveFaceValue={Number(ticketWave.faceValue)}
          />

          <SoldTicketsSection
            tickets={soldTickets}
            ticketWaveName={ticketWave.name}
            ticketWaveCurrency={ticketWave.currency}
            onUploadClick={handleUploadClick}
          />

          <CancelledTicketsSection
            tickets={cancelledTickets}
            ticketWaveName={ticketWave.name}
          />
        </Accordion>
      </CardContent>
    </Card>
  );
}
