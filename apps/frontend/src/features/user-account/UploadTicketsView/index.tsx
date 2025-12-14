import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useNavigate, useSearch} from '@tanstack/react-router';
import {getMyListingsQuery} from '~/lib';
import {TicketDocumentUploadModal, TicketUploadCarousel} from '~/components';
import {Card, CardContent} from '~/components/ui/card';
import {Button} from '~/components/ui/button';
import {LoadingSpinner} from '~/components/LoadingScreen';
import {Upload, Timer, XCircle} from 'lucide-react';
import {EmptyState} from './EmptyState';
import {TicketNeedingUploadCard} from './TicketCard';
import {TicketWaitingCard} from './TicketWaitingCard';
import {TicketExpiredCard} from './TicketExpiredCard';
import {SectionHeader} from './SectionHeader';

export function UploadTicketsView() {
  const {data: listings, isPending} = useQuery(getMyListingsQuery());
  const search = useSearch({from: '/cuenta/subir-tickets'});
  const navigate = useNavigate({from: '/cuenta/subir-tickets'});
  const [carouselOpen, setCarouselOpen] = useState(false);

  const now = new Date();
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Find all sold tickets that need documents
  // Backend already checks event end date via canUploadDocument
  const ticketsNeedingUpload =
    listings
      ?.flatMap(listing =>
        listing.tickets
          .filter(
            ticket =>
              ticket.soldAt && !ticket.hasDocument && ticket.canUploadDocument,
          )
          .map(ticket => ({
            ...ticket,
            listing,
          })),
      )
      .filter(Boolean) || [];

  // Find tickets that can't upload yet (too early)
  // Exclude tickets with event_ended reason (they go to expired section)
  const ticketsWaiting =
    listings
      ?.flatMap(listing =>
        listing.tickets
          .filter(
            ticket =>
              ticket.soldAt &&
              !ticket.hasDocument &&
              !ticket.canUploadDocument &&
              ticket.uploadUnavailableReason !== 'event_ended',
          )
          .map(ticket => ({
            ...ticket,
            listing,
          })),
      )
      .filter(Boolean) || [];

  // Find tickets from events that have ended
  // Only show if event ended less than 3 days ago
  const ticketsExpired =
    listings
      ?.flatMap(listing =>
        listing.tickets
          .filter(
            ticket =>
              ticket.soldAt &&
              !ticket.hasDocument &&
              !ticket.canUploadDocument &&
              ticket.uploadUnavailableReason === 'event_ended',
          )
          .map(ticket => ({
            ...ticket,
            listing,
          }))
          .filter(ticket => {
            const eventEndDate = new Date(ticket.listing.event.eventEndDate);
            // Only show if event ended less than 3 days ago
            return eventEndDate >= threeDaysAgo;
          }),
      )
      .filter(Boolean) || [];

  // Find the ticket to upload based on search param
  const ticketToUpload = search.subirTicket
    ? ticketsNeedingUpload.find(ticket => ticket.id === search.subirTicket)
    : null;

  const handleCloseModal = () => {
    navigate({
      search: prev => ({
        ...prev,
        subirTicket: undefined,
      }),
    });
  };

  const handleUploadClick = (ticketId: string) => {
    navigate({
      search: prev => ({
        ...prev,
        subirTicket: ticketId,
      }),
    });
  };

  if (isPending) {
    return (
      <Card className='w-full'>
        <CardContent className='flex h-96 items-center justify-center'>
          <LoadingSpinner size={96} />
        </CardContent>
      </Card>
    );
  }

  const hasNoTickets =
    ticketsNeedingUpload.length === 0 &&
    ticketsWaiting.length === 0 &&
    ticketsExpired.length === 0;

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-semibold'>Subir tickets</h2>
        <p className='text-muted-foreground'>
          Sube los documentos de tus tickets vendidos
        </p>
      </div>

      {/* Tickets Needing Upload */}
      {ticketsNeedingUpload.length > 0 && (
        <div className='space-y-4'>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex-1'>
              <SectionHeader
                icon={Upload}
                title='Tickets pendientes'
                count={ticketsNeedingUpload.length}
                className='text-orange-200'
              />
            </div>
            {ticketsNeedingUpload.length > 1 && (
              <Button onClick={() => setCarouselOpen(true)}>
                <Upload className='mr-2 h-4 w-4' />
                Subir todos ({ticketsNeedingUpload.length})
              </Button>
            )}
          </div>
          <div className='space-y-3'>
            {ticketsNeedingUpload.map(ticket => (
              <TicketNeedingUploadCard
                key={ticket.id}
                ticket={ticket}
                onUploadClick={handleUploadClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tickets Waiting (too early) */}
      {ticketsWaiting.length > 0 && (
        <div className='space-y-4'>
          <SectionHeader
            icon={Timer}
            title='Próximamente'
            count={ticketsWaiting.length}
            className='text-muted-foreground'
          />
          <div className='space-y-3'>
            {ticketsWaiting.map(ticket => (
              <TicketWaitingCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </div>
      )}

      {/* Tickets Expired (event ended, visible for 3 days) */}
      {ticketsExpired.length > 0 && (
        <div className='space-y-4'>
          <SectionHeader
            icon={XCircle}
            title='Expirado'
            count={ticketsExpired.length}
            className='text-red-600'
          />
          <div className='space-y-3'>
            {ticketsExpired.map(ticket => (
              <TicketExpiredCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {hasNoTickets && <EmptyState />}

      {/* Single Upload Modal */}
      {ticketToUpload && (
        <TicketDocumentUploadModal
          ticketId={ticketToUpload.id}
          hasExistingDocument={ticketToUpload.hasDocument || false}
          open={!!search.subirTicket}
          onOpenChange={open => {
            if (!open) {
              handleCloseModal();
            }
          }}
        />
      )}

      {/* Carousel Upload Modal */}
      {ticketsNeedingUpload.length > 0 && (
        <TicketUploadCarousel
          tickets={ticketsNeedingUpload}
          open={carouselOpen}
          onOpenChange={setCarouselOpen}
          initialIndex={
            search.subirTicket
              ? ticketsNeedingUpload.findIndex(t => t.id === search.subirTicket)
              : 0
          }
        />
      )}
    </div>
  );
}
