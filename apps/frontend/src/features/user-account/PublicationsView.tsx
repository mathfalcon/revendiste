import {useState, useEffect, useCallback} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useNavigate, useSearch} from '@tanstack/react-router';
import {getMyListingsQuery} from '~/lib';
import {ListingCard, TicketUploadModal} from '~/components';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {Button} from '~/components/ui/button';
import {AccountEmptyState} from '~/features/user-account';
import {Package, Archive, Upload, AlertCircle} from 'lucide-react';
import {LoadingSpinner} from '~/components/LoadingScreen';
import {Card, CardContent} from '~/components/ui/card';
import {Alert, AlertDescription} from '~/components/ui/alert';

export function PublicationsView() {
  const {data: listings, isPending} = useQuery(getMyListingsQuery());
  const search = useSearch({from: '/cuenta/publicaciones/'});
  const navigate = useNavigate({from: '/cuenta/publicaciones/'});
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(['active']);

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
  // Now includes unsold tickets within the upload window (canUploadDocument is true)
  const allTicketsNeedingUpload =
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

  // Find listing by ID from query parameter
  const listingFromParam = search.subirPublicacion
    ? listings?.find(listing => listing.id === search.subirPublicacion)
    : null;

  const scrollToListingCard = useCallback((listingId: string) => {
    const openAndScroll = () => {
      document
        .getElementById(`listing-card-${listingId}`)
        ?.scrollIntoView({behavior: 'smooth', block: 'start'});
    };
    // Accordion content must be open before scroll (Radix keeps closed panels out of layout).
    window.setTimeout(openAndScroll, 280);
  }, []);

  // Open the right accordion panel and scroll to the card (after layout; Radix hides closed content).
  useEffect(() => {
    if (!listingFromParam || !search.subirPublicacion) {
      return;
    }
    const section =
      new Date(listingFromParam.event.eventEndDate) > new Date()
        ? 'active'
        : 'sold';
    setOpenSections(prev =>
      prev.includes(section) ? prev : [...prev, section],
    );
    scrollToListingCard(listingFromParam.id);
  }, [search.subirPublicacion, listingFromParam, scrollToListingCard]);

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
      // Only open if there are tickets needing upload
      if (listingTicketsNeedingUpload.length > 0) {
        setCarouselOpen(true);
      } else {
        // Clear the param if no tickets need upload (listing found but no pending uploads)
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
      <div className='space-y-6'>
        <div>
          <h2 className='text-2xl font-semibold'>Mis publicaciones</h2>
          <p className='text-muted-foreground'>
            Administra tus publicaciones de entradas
          </p>
        </div>
        <AccountEmptyState
          icon={<Package className='h-8 w-8 text-muted-foreground' />}
          title='No hay publicaciones'
          description='Comienza creando tu primera publicación de entradas'
        />
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
        <Alert variant='destructive' className='bg-background flex'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription className='flex-1 flex items-center'>
            Tenés {allTicketsNeedingUpload.length}{' '}
            {allTicketsNeedingUpload.length === 1
              ? 'entrada pendiente por subir'
              : 'entradas pendientes por subir'}
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
        </Alert>
      )}

      <Accordion
        type='multiple'
        value={openSections}
        onValueChange={setOpenSections}
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
              <div className='space-y-3'>
                {activeListings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <p className='py-8 text-center text-muted-foreground'>
                No tenés publicaciones activas
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
              <div className='space-y-3'>
                {soldListings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <p className='py-8 text-center text-muted-foreground'>
                No tenés publicaciones pasadas
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Single Ticket Upload Modal (from URL param) */}
      {search.subirTicket && ticketToUpload && (
        <TicketUploadModal
          tickets={{
            ...ticketToUpload,
            listing: listings?.find(l =>
              l.tickets.some(t => t.id === ticketToUpload.id),
            )!,
          }}
          open={!!search.subirTicket}
          onOpenChange={open => {
            if (!open) handleCloseModal();
          }}
        />
      )}

      {/* Batch Upload Modal - keep mounted while open to prevent unmount during completion screen */}
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
