import {useState, useEffect} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useNavigate, useSearch} from '@tanstack/react-router';
import {getMyListingsQuery} from '~/lib';
import {
  ListingCard,
  TicketDocumentUploadModal,
  TicketUploadCarousel,
} from '~/components';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {Button} from '~/components/ui/button';
import {Package, Archive, Upload, AlertCircle} from 'lucide-react';
import {LoadingSpinner} from '~/components/LoadingScreen';
import {Card, CardContent} from '~/components/ui/card';
import {Alert, AlertDescription} from '~/components/ui/alert';

export function PublicationsView() {
  const {data: listings, isPending} = useQuery(getMyListingsQuery());
  const search = useSearch({from: '/cuenta/publicaciones'});
  const navigate = useNavigate({from: '/cuenta/publicaciones'});
  const [carouselOpen, setCarouselOpen] = useState(false);

  // Find the ticket to upload based on search param
  const ticketToUpload = search.subirTicket
    ? listings
        ?.flatMap(listing => listing.tickets)
        .find(ticket => ticket.id === search.subirTicket)
    : null;

  // Separate listings into active and past
  // A listing is active if the event hasn't ended yet (regardless of sold status)
  const now = new Date();
  const activeListings =
    listings?.filter(listing => new Date(listing.event.eventEndDate) > now) ||
    [];

  // A listing is past if the event has ended
  const soldListings =
    listings?.filter(listing => new Date(listing.event.eventEndDate) <= now) ||
    [];

  // Collect all tickets needing upload across all listings
  const allTicketsNeedingUpload =
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

  // Find listing by ID from query parameter
  const listingFromParam = search.subirPublicacion
    ? listings?.find(listing => listing.id === search.subirPublicacion)
    : null;

  // Get tickets from specific listing that need upload
  const listingTicketsNeedingUpload = listingFromParam
    ? listingFromParam.tickets
        .filter(
          ticket =>
            ticket.soldAt && !ticket.hasDocument && ticket.canUploadDocument,
        )
        .map(ticket => ({
          ...ticket,
          listing: listingFromParam,
        }))
    : [];

  // Auto-open carousel when subirPublicacion parameter is present and has tickets
  useEffect(() => {
    if (search.subirPublicacion && listingTicketsNeedingUpload.length > 0) {
      setCarouselOpen(true);
    }
  }, [search.subirPublicacion, listingTicketsNeedingUpload.length]);

  const handleCloseModal = () => {
    navigate({
      search: prev => ({
        ...prev,
        subirTicket: undefined,
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

  if (!listings || listings.length === 0) {
    return (
      <div className='flex h-96 items-center justify-center rounded-lg border bg-card p-6 text-card-foreground shadow-sm'>
        <div className='text-center'>
          <p className='text-lg font-semibold'>No hay publicaciones</p>
          <p className='text-muted-foreground'>
            Comienza creando tu primera publicación de entradas
          </p>
        </div>
      </div>
    );
  }

  // Determine which tickets to show in carousel
  // If subirPublicacion param is present, show only that listing's tickets
  // Otherwise, show all tickets
  const ticketsForCarousel = search.subirPublicacion
    ? listingTicketsNeedingUpload
    : allTicketsNeedingUpload;

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

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-semibold'>Mis publicaciones</h2>
        <p className='text-muted-foreground'>
          Administra tus publicaciones de entradas
        </p>
      </div>

      {/* Pending Tickets Alert */}
      {allTicketsNeedingUpload.length > 0 && !search.subirPublicacion && (
        <Alert variant='destructive' className='bg-background'>
          <AlertCircle className='h-4 w-4' />
          <div className='flex items-center justify-between w-full'>
            <AlertDescription className='flex-1'>
              Tenés {allTicketsNeedingUpload.length}{' '}
              {allTicketsNeedingUpload.length === 1
                ? 'ticket pendiente por subir'
                : 'tickets pendientes por subir'}
            </AlertDescription>
            {allTicketsNeedingUpload.length > 0 && (
              <Button
                onClick={() => setCarouselOpen(true)}
                variant='default'
                size='sm'
                className='ml-4'
              >
                <Upload className='mr-2 h-4 w-4' />
                Subir todos ({allTicketsNeedingUpload.length})
              </Button>
            )}
          </div>
        </Alert>
      )}

      <Accordion
        type='multiple'
        defaultValue={
          search.subirPublicacion && listingFromParam
            ? [
                new Date(listingFromParam.event.eventEndDate) > now
                  ? 'active'
                  : 'sold',
              ].filter(Boolean)
            : ['active']
        }
        className='w-full flex flex-col gap-4'
      >
        {/* Active Listings */}
        <AccordionItem value='active' className='border-none'>
          <AccordionTrigger className='rounded-lg border bg-card px-4 py-3 hover:no-underline'>
            <div className='flex items-center gap-2'>
              <Package className='h-4 w-4' />
              <span className='font-semibold'>
                Publicaciones activas ({activeListings.length})
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className='pt-4'>
            {activeListings.length > 0 ? (
              <div className='space-y-4'>
                {activeListings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <p className='py-8 text-center text-muted-foreground'>
                No tienes publicaciones activas
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Sold/Expired Listings */}
        <AccordionItem value='sold' className='border-none'>
          <AccordionTrigger className='rounded-lg border bg-card px-4 py-3 hover:no-underline'>
            <div className='flex items-center gap-2'>
              <Archive className='h-4 w-4' />
              <span className='font-semibold'>
                Publicaciones pasadas ({soldListings.length})
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className='pt-4'>
            {soldListings.length > 0 ? (
              <div className='space-y-4'>
                {soldListings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <p className='py-8 text-center text-muted-foreground'>
                No tienes publicaciones vendidas
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Single Upload Modal */}
      {/* Render modal when subirTicket param is present, even if ticket data isn't loaded yet */}
      {/* This allows the modal to open when coming from email links */}
      {search.subirTicket && (
        <TicketDocumentUploadModal
          ticketId={search.subirTicket}
          hasExistingDocument={ticketToUpload?.hasDocument || false}
          open={!!search.subirTicket}
          onOpenChange={open => {
            if (!open) {
              handleCloseModal();
            }
          }}
        />
      )}

      {/* Carousel Upload Modal */}
      {ticketsForCarousel.length > 0 && (
        <TicketUploadCarousel
          tickets={ticketsForCarousel}
          open={carouselOpen}
          onOpenChange={handleCarouselClose}
          initialIndex={
            search.subirTicket
              ? ticketsForCarousel.findIndex(t => t.id === search.subirTicket)
              : undefined
          }
        />
      )}
    </div>
  );
}
