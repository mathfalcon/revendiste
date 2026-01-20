import {useState, useEffect} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useNavigate, useSearch} from '@tanstack/react-router';
import {getMyListingsQuery} from '~/lib';
import {TicketUploadModal} from '~/components';
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

  // Find all tickets that need documents and can upload now
  // Includes both sold and unsold tickets within the upload window
  const ticketsNeedingUpload =
    listings
      ?.flatMap(listing =>
        listing.tickets
          .filter(ticket => !ticket.hasDocument && ticket.canUploadDocument)
          .map(ticket => ({
            ...ticket,
            listing,
          })),
      )
      .filter(Boolean) || [];

  // Find tickets that can't upload yet (too early)
  // Only shows unsold tickets - sold tickets should always be uploadable
  // Exclude tickets with event_ended reason (they go to expired section)
  const ticketsWaiting =
    listings
      ?.flatMap(listing =>
        listing.tickets
          .filter(
            ticket =>
              !ticket.soldAt &&
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

  // Find listing by ID from query parameter
  const listingFromParam = search.subirPublicacion
    ? listings?.find(listing => listing.id === search.subirPublicacion)
    : null;

  // Get tickets from specific listing that need upload
  const listingTicketsNeedingUpload = listingFromParam
    ? listingFromParam.tickets
        .filter(ticket => !ticket.hasDocument && ticket.canUploadDocument)
        .map(ticket => ({
          ...ticket,
          listing: listingFromParam,
        }))
    : [];

  // Auto-open carousel when subirPublicacion parameter is present and listing exists
  useEffect(() => {
    if (search.subirPublicacion && listingFromParam) {
      if (listingTicketsNeedingUpload.length > 0) {
        setCarouselOpen(true);
      } else {
        // Clear the param if no tickets need upload
        navigate({
          search: prev => ({
            ...prev,
            subirPublicacion: undefined,
          }),
        });
      }
    }
  }, [search.subirPublicacion, listingFromParam, listingTicketsNeedingUpload.length, navigate]);

  const handleCloseModal = () => {
    navigate({
      search: prev => ({
        ...prev,
        subirTicket: undefined,
      }),
    });
  };

  const handleCarouselClose = (open: boolean) => {
    setCarouselOpen(open);
    // Clear subirPublicacion param when closing carousel
    if (!open && search.subirPublicacion) {
      navigate({
        search: prev => ({
          ...prev,
          subirPublicacion: undefined,
        }),
      });
    }
  };

  // Determine which tickets to show in carousel
  // If subirPublicacion param is present, show only that listing's tickets
  // Otherwise, show all tickets needing upload
  const ticketsForCarousel = search.subirPublicacion
    ? listingTicketsNeedingUpload
    : ticketsNeedingUpload;

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
          Sube los documentos de tus tickets
        </p>
      </div>

      {/* Tickets Needing Upload */}
      {ticketsNeedingUpload.length > 0 && (
        <div className='space-y-4'>
          <div className='flex items-center justify-between gap-4'>
            <SectionHeader
              icon={Upload}
              title='Tickets pendientes'
              count={ticketsNeedingUpload.length}
              variant='pending'
            />
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
            variant='waiting'
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
            title='Expirados'
            count={ticketsExpired.length}
            variant='expired'
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

      {/* Single Ticket Upload Modal (from URL param) */}
      {ticketToUpload && (
        <TicketUploadModal
          tickets={ticketToUpload}
          open={!!search.subirTicket}
          onOpenChange={open => {
            if (!open) handleCloseModal();
          }}
        />
      )}

      {/* Batch Upload Modal */}
      {(carouselOpen || ticketsForCarousel.length > 0) && (
        <TicketUploadModal
          tickets={ticketsForCarousel}
          open={carouselOpen}
          onOpenChange={handleCarouselClose}
          initialTicketId={search.subirTicket}
        />
      )}
    </div>
  );
}
