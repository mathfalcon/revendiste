import {useQuery} from '@tanstack/react-query';
import {useNavigate, useSearch} from '@tanstack/react-router';
import {getMyListingsQuery} from '~/lib';
import {TicketDocumentUploadModal} from '~/components';
import {Card, CardContent} from '~/components/ui/card';
import {LoadingSpinner} from '~/components/LoadingScreen';
import {Upload, FileCheck, Timer, XCircle} from 'lucide-react';
import {EmptyState} from './EmptyState';
import {TicketNeedingUploadCard} from './TicketCard';
import {TicketWaitingCard} from './TicketWaitingCard';
import {TicketWithDocumentCard} from './TicketWithDocumentCard';
import {TicketExpiredCard} from './TicketExpiredCard';
import {SectionHeader} from './SectionHeader';

export function UploadTicketsView() {
  const {data: listings, isPending} = useQuery(getMyListingsQuery());
  const search = useSearch({from: '/cuenta/subir-tickets'});
  const navigate = useNavigate({from: '/cuenta/subir-tickets'});

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

  // Find tickets that have documents (for reference)
  // Only show if canUploadDocument is true (backend checks event end date)
  const ticketsWithDocuments =
    listings
      ?.flatMap(listing =>
        listing.tickets
          .filter(
            ticket =>
              ticket.soldAt && ticket.hasDocument && ticket.canUploadDocument,
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
    ? [...ticketsNeedingUpload, ...ticketsWithDocuments].find(
        ticket => ticket.id === search.subirTicket,
      )
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
    ticketsWithDocuments.length === 0 &&
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
          <SectionHeader
            icon={Upload}
            title='Tickets pendientes'
            count={ticketsNeedingUpload.length}
            className='text-orange-600'
          />
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

      {/* Tickets With Documents (for reference) */}
      {ticketsWithDocuments.length > 0 && (
        <div className='space-y-4'>
          <SectionHeader
            icon={FileCheck}
            title='Tickets subidos'
            count={ticketsWithDocuments.length}
            className='text-muted-foreground'
          />
          <div className='space-y-3'>
            {ticketsWithDocuments.map(ticket => (
              <TicketWithDocumentCard
                key={ticket.id}
                ticket={ticket}
                onEditClick={handleUploadClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {hasNoTickets && <EmptyState />}

      {/* Upload Modal */}
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
    </div>
  );
}
