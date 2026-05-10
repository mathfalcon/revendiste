import {Link} from '@tanstack/react-router';
import {Ticket, ArrowRight} from 'lucide-react';
import {Card, CardContent} from '~/components/ui/card';
import {formatPrice} from '~/utils';
import type {GetEventByIdResponse} from '~/lib';

interface MyListingsBannerProps {
  userListings: GetEventByIdResponse['userListings'];
}

/**
 * Shown on the event page when the current user is also a seller for this
 * event. Their own listings are filtered out of the public buy grid, so this
 * banner makes it explicit that they have active publications and shows the
 * listed prices so they can compare with the rest.
 */
export function MyListingsBanner({userListings}: MyListingsBannerProps) {
  const visibleListings = userListings.filter(
    l => Number(l.availableTicketCount) > 0,
  );

  if (visibleListings.length === 0) return null;

  return (
    <Card className='border-dashed border-primary/40 bg-primary/5'>
      <CardContent className='py-4 px-4 flex flex-col gap-3'>
        <div className='flex items-start gap-3'>
          <div className='flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0'>
            <Ticket className='w-4 h-4 text-primary' />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='font-medium text-sm text-foreground'>
              {visibleListings.length === 1
                ? 'Tenés una publicación activa en este evento'
                : `Tenés ${visibleListings.length} publicaciones activas en este evento`}
            </p>
            <p className='text-xs text-muted-foreground mt-0.5'>
              No las ves en la lista porque no podés comprar tus propias
              entradas.
            </p>
          </div>
        </div>

        <ul className='flex flex-col gap-1.5 pl-11'>
          {visibleListings.map(listing => {
            const ticketCount = Number(listing.availableTicketCount);
            const minPrice = listing.minPrice ? Number(listing.minPrice) : null;
            const maxPrice = listing.maxPrice ? Number(listing.maxPrice) : null;
            const samePrice =
              minPrice !== null && maxPrice !== null && minPrice === maxPrice;

            return (
              <li
                key={listing.id}
                className='flex items-center justify-between gap-2 text-xs'
              >
                <span className='text-muted-foreground truncate'>
                  {ticketCount}{' '}
                  {ticketCount === 1 ? 'entrada' : 'entradas'} ·{' '}
                  {listing.ticketWaveName}
                </span>
                <span className='font-semibold text-foreground shrink-0'>
                  {minPrice !== null && maxPrice !== null
                    ? samePrice
                      ? formatPrice(minPrice, listing.currency)
                      : `${formatPrice(minPrice, listing.currency)} – ${formatPrice(
                          maxPrice,
                          listing.currency,
                        )}`
                    : '—'}
                </span>
              </li>
            );
          })}
        </ul>

        <Link
          to='/cuenta/publicaciones'
          className='flex items-center gap-1 text-xs text-primary hover:underline pl-11'
        >
          Ver mis publicaciones
          <ArrowRight className='w-3 h-3' />
        </Link>
      </CardContent>
    </Card>
  );
}
