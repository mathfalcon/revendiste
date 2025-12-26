import {useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '~/components/ui/card';
import {Checkbox} from '~/components/ui/checkbox';
import {Badge} from '~/components/ui/badge';
import {formatCurrency, formatDate} from '~/utils';
import type {EventTicketCurrency} from '@revendiste/shared';

interface EarningsByListing {
  listingId: string;
  publisherUserId: string;
  totalAmount: string;
  ticketCount: number;
  currency: EventTicketCurrency;
}

interface EarningsByTicket {
  id: string;
  listingTicketId: string;
  sellerAmount: string;
  currency: EventTicketCurrency;
  holdUntil: Date | string;
  listingId: string;
  publisherUserId: string;
}

interface EarningsSelectionSectionProps {
  byListing: EarningsByListing[];
  byTicket: EarningsByTicket[];
  selectedListingIds: string[];
  selectedTicketIds: string[];
  onListingToggle: (listingId: string) => void;
  onTicketToggle: (ticketId: string) => void;
}

export function EarningsSelectionSection({
  byListing,
  byTicket,
  selectedListingIds,
  selectedTicketIds,
  onListingToggle,
  onTicketToggle,
}: EarningsSelectionSectionProps) {
  const [viewMode, setViewMode] = useState<'listing' | 'ticket'>('listing');

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold mb-2'>Ganancias Disponibles</h3>
          <p className='text-sm text-muted-foreground'>
            Selecciona las ganancias que deseas retirar
          </p>
        </div>
        <div className='flex gap-2'>
          <button
            onClick={() => setViewMode('listing')}
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === 'listing'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            Por Publicación
          </button>
          <button
            onClick={() => setViewMode('ticket')}
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === 'ticket'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            Por Ticket
          </button>
        </div>
      </div>

      {viewMode === 'listing' ? (
        <div className='space-y-3'>
          {byListing.length === 0 ? (
            <Card>
              <CardContent className='py-8 text-center text-muted-foreground'>
                No hay ganancias disponibles agrupadas por publicación
              </CardContent>
            </Card>
          ) : (
            byListing.map(listing => {
              // Check if any tickets from this listing are selected
              const hasSelectedTickets = byTicket.some(
                ticket =>
                  ticket.listingId === listing.listingId &&
                  selectedTicketIds.includes(ticket.listingTicketId),
              );

              return (
                <Card key={listing.listingId}>
                  <CardContent className='p-4'>
                    <div className='flex items-start gap-3'>
                      <Checkbox
                        checked={selectedListingIds.includes(listing.listingId)}
                        disabled={hasSelectedTickets}
                        onCheckedChange={() =>
                          onListingToggle(listing.listingId)
                        }
                      />
                      <div className='flex-1'>
                        <div className='flex items-center justify-between mb-2'>
                          <span className='font-semibold'>
                            Publicación {listing.listingId.slice(0, 8)}
                          </span>
                          <Badge variant='outline'>{listing.currency}</Badge>
                        </div>
                        <div className='text-sm text-muted-foreground space-y-1'>
                          <div>
                            Total: {formatCurrency(listing.totalAmount, listing.currency)}
                          </div>
                          <div>{listing.ticketCount} ticket(s)</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <div className='space-y-3'>
          {byTicket.length === 0 ? (
            <Card>
              <CardContent className='py-8 text-center text-muted-foreground'>
                No hay ganancias disponibles por ticket individual
              </CardContent>
            </Card>
          ) : (
            byTicket.map(ticket => {
              // Check if the listing this ticket belongs to is selected
              const isListingSelected = selectedListingIds.includes(
                ticket.listingId,
              );

              return (
                <Card key={ticket.id}>
                  <CardContent className='p-4'>
                    <div className='flex items-start gap-3'>
                      <Checkbox
                        checked={selectedTicketIds.includes(
                          ticket.listingTicketId,
                        )}
                        disabled={isListingSelected}
                        onCheckedChange={() =>
                          onTicketToggle(ticket.listingTicketId)
                        }
                      />
                      <div className='flex-1'>
                        <div className='flex items-center justify-between mb-2'>
                          <span className='font-semibold'>
                            Ticket {ticket.listingTicketId.slice(0, 8)}
                          </span>
                          <Badge variant='outline'>{ticket.currency}</Badge>
                        </div>
                        <div className='text-sm text-muted-foreground space-y-1'>
                          <div>
                            Monto: {formatCurrency(ticket.sellerAmount, ticket.currency)}
                          </div>
                          {ticket.holdUntil && (
                            <div>
                              Disponible desde:{' '}
                              {formatDate(ticket.holdUntil)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

