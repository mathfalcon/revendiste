import {useQuery} from '@tanstack/react-query';
import {createFileRoute} from '@tanstack/react-router';
import {getMyListingsQuery} from '~/lib';
import {ListingCard} from '~/components';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {Package, Archive} from 'lucide-react';
import {LoadingSpinner} from '~/components/LoadingScreen';
import {Card, CardContent} from '~/components/ui/card';

export const Route = createFileRoute('/cuenta/publicaciones')({
  component: PublicacionesComponent,
});

function PublicacionesComponent() {
  const {data: listings, isPending} = useQuery(getMyListingsQuery());

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

  // Separate listings into active and sold/expired
  const activeListings = listings.filter(listing => !listing.soldAt);
  const soldListings = listings.filter(listing => listing.soldAt);

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-semibold'>Mis publicaciones</h2>
        <p className='text-muted-foreground'>
          Administra tus publicaciones de entradas
        </p>
      </div>

      <Accordion
        type='multiple'
        defaultValue={['active']}
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
    </div>
  );
}
