import {useMemo} from 'react';
import {Link, useNavigate, useSearch} from '@tanstack/react-router';
import {useQuery} from '@tanstack/react-query';
import {ArrowLeft, Package} from 'lucide-react';
import {getMyListingByIdQuery} from '~/lib';
import {ListingCard, TicketUploadModal} from '~/components';
import {Button} from '~/components/ui/button';
import {LoadingSpinner} from '~/components/LoadingScreen';
import {Card, CardContent} from '~/components/ui/card';
import {AccountEmptyState} from './AccountEmptyState';

export function SinglePublicationView({listingId}: {listingId: string}) {
  const search = useSearch({from: '/cuenta/publicaciones/$listingId'});
  const navigate = useNavigate({from: '/cuenta/publicaciones/$listingId'});
  const {data: listing, isPending, isError} = useQuery(
    getMyListingByIdQuery(listingId),
  );

  const ticketToUpload = useMemo(() => {
    if (!search.subirTicket || !listing) return null;
    return listing.tickets.find(t => t.id === search.subirTicket) ?? null;
  }, [search.subirTicket, listing]);

  const handleCloseTicketModal = () => {
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

  if (isError || !listing) {
    return (
      <div className='space-y-6'>
        <Button variant='ghost' size='sm' className='-ml-2' asChild>
          <Link to='/cuenta/publicaciones'>
            <ArrowLeft className='h-4 w-4 mr-2' aria-hidden />
            Volver a publicaciones
          </Link>
        </Button>
        <AccountEmptyState
          icon={<Package className='h-8 w-8 text-muted-foreground' />}
          title='No encontramos la publicación'
          description='Puede que ya no esté en tu cuenta o el enlace no sea válido.'
        />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center gap-3'>
        <Button variant='ghost' size='sm' className='-ml-2 shrink-0' asChild>
          <Link to='/cuenta/publicaciones'>
            <ArrowLeft className='h-4 w-4 mr-2' aria-hidden />
            Todas las publicaciones
          </Link>
        </Button>
      </div>
      <div>
        <h2 className='text-2xl font-semibold'>Publicación</h2>
        <p className='text-muted-foreground text-sm'>{listing.event.name}</p>
      </div>

      <ListingCard
        listing={listing}
        navigateFrom='/cuenta/publicaciones/$listingId'
      />

      {search.subirTicket && ticketToUpload ? (
        <TicketUploadModal
          tickets={{
            ...ticketToUpload,
            listing,
          }}
          open={!!search.subirTicket}
          onOpenChange={open => {
            if (!open) handleCloseTicketModal();
          }}
        />
      ) : null}
    </div>
  );
}
