import {formatEventDate, formatPrice} from '~/utils/string';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {type ReturnTypeTicketListingsServiceAtGetUserListingsWithTickets} from '~/lib';
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  MoreVertical,
  Edit,
  Minus,
} from 'lucide-react';
import {Link} from '@tanstack/react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

interface ListingCardProps {
  listing: ReturnTypeTicketListingsServiceAtGetUserListingsWithTickets[number];
}

export function ListingCard({listing}: ListingCardProps) {
  const {event, ticketWave, tickets, soldAt, createdAt} = listing;

  const startDate = new Date(event.eventStartDate);
  const endDate = new Date(event.eventEndDate);
  const createdDate = new Date(createdAt);
  const soldDate = soldAt ? new Date(soldAt) : null;

  // Filter tickets by status
  const activeTickets = tickets.filter(
    ticket => !ticket.cancelledAt && !ticket.soldAt,
  );
  const soldTickets = tickets.filter(ticket => ticket.soldAt);
  const cancelledTickets = tickets.filter(ticket => ticket.cancelledAt);

  const status = soldDate ? 'vendido' : 'activo';
  const statusColor = soldDate ? 'text-green-600' : 'text-blue-600';

  return (
    <Card className='w-full'>
      <CardHeader>
        <div className='flex items-start justify-between'>
          <div className='space-y-1'>
            <CardTitle className='text-xl'>
              <Link
                to='/eventos/$eventId'
                params={{eventId: event.id}}
                className='hover:text-primary transition-colors'
              >
                {event.name}
              </Link>
            </CardTitle>
            <CardDescription className='text-base'>
              {ticketWave.name}
            </CardDescription>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusColor}`}
          >
            {status}
          </span>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        <Accordion type='single' collapsible className='w-full'>
          {/* Event Details */}
          <AccordionItem value='event' className='border-none'>
            <AccordionTrigger className='py-2 text-sm font-medium hover:no-underline'>
              <div className='flex items-center gap-2'>
                <Calendar className='h-4 w-4' />
                Detalles del evento
              </div>
            </AccordionTrigger>
            <AccordionContent className='space-y-3 pl-6 text-sm'>
              <div className='space-y-2'>
                <div className='flex items-start gap-2'>
                  <Clock className='h-4 w-4 text-muted-foreground mt-0.5' />
                  <div>
                    <p className='font-medium'>Fecha y hora</p>
                    <p className='text-muted-foreground'>
                      {formatEventDate(startDate)}
                    </p>
                    {endDate && endDate.getTime() !== startDate.getTime() && (
                      <p className='text-muted-foreground'>
                        Hasta: {formatEventDate(endDate)}
                      </p>
                    )}
                  </div>
                </div>
                {event.venueName && (
                  <div className='flex items-start gap-2'>
                    <MapPin className='h-4 w-4 text-muted-foreground mt-0.5' />
                    <div>
                      <p className='font-medium'>{event.venueName}</p>
                      <p className='text-muted-foreground'>
                        {event.venueAddress}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Active Tickets */}
          {activeTickets.length > 0 && (
            <AccordionItem value='active-tickets' className='border-none'>
              <AccordionTrigger className='py-2 text-sm font-medium hover:no-underline'>
                <div className='flex items-center gap-2'>
                  <Ticket className='h-4 w-4 text-blue-600' />
                  Tickets activos ({activeTickets.length})
                </div>
              </AccordionTrigger>
              <AccordionContent className='pl-6'>
                <div className='space-y-2'>
                  {activeTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      className='rounded-lg border bg-muted/50 p-3 text-sm'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='space-y-1 flex-1'>
                          <div className='flex items-center gap-2'>
                            <p className='font-medium'>
                              Ticket #{ticket.ticketNumber}
                            </p>
                            <p className='text-xs text-muted-foreground font-mono'>
                              (ID: {ticket.id})
                            </p>
                          </div>
                          <p className='text-xs text-muted-foreground'>
                            {ticketWave.name}
                          </p>
                          <p className='text-muted-foreground'>
                            Precio:{' '}
                            {formatPrice(
                              parseFloat(ticket.price),
                              ticketWave.currency,
                            )}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className='rounded-sm p-1 hover:bg-accent focus:outline-none'>
                              <MoreVertical className='h-4 w-4' />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem>
                              <Edit className='mr-2 h-4 w-4' />
                              Editar precio
                            </DropdownMenuItem>
                            <DropdownMenuItem className='text-red-600'>
                              <Minus className='mr-2 h-4 w-4' />
                              Retirar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Sold Tickets */}
          {soldTickets.length > 0 && (
            <AccordionItem value='sold-tickets' className='border-none'>
              <AccordionTrigger className='py-2 text-sm font-medium hover:no-underline'>
                <div className='flex items-center gap-2'>
                  <Ticket className='h-4 w-4 text-green-600' />
                  Tickets vendidos ({soldTickets.length})
                </div>
              </AccordionTrigger>
              <AccordionContent className='pl-6'>
                <div className='space-y-2'>
                  {soldTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      className='rounded-lg border border-green-200 bg-muted/50 p-3 text-sm'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='space-y-1'>
                          <div className='flex items-center gap-2'>
                            <p className='font-medium'>
                              Ticket #{ticket.ticketNumber}
                            </p>
                            <p className='text-xs text-muted-foreground font-mono'>
                              (ID: {ticket.id})
                            </p>
                          </div>
                          <p className='text-xs text-muted-foreground'>
                            {ticketWave.name}
                          </p>
                          <p className='text-muted-foreground'>
                            Vendido por:{' '}
                            {formatPrice(
                              parseFloat(ticket.price),
                              ticketWave.currency,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Cancelled Tickets */}
          {cancelledTickets.length > 0 && (
            <AccordionItem value='cancelled-tickets' className='border-none'>
              <AccordionTrigger className='py-2 text-sm font-medium hover:no-underline'>
                <div className='flex items-center gap-2'>
                  <Ticket className='h-4 w-4 text-red-600' />
                  Tickets cancelados ({cancelledTickets.length})
                </div>
              </AccordionTrigger>
              <AccordionContent className='pl-6'>
                <div className='space-y-2'>
                  {cancelledTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      className='rounded-lg border border-red-200 bg-muted/50 p-3 text-sm'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='space-y-1'>
                          <div className='flex items-center gap-2'>
                            <p className='font-medium'>
                              Ticket #{ticket.ticketNumber}
                            </p>
                            <p className='text-xs text-muted-foreground font-mono'>
                              (ID: {ticket.id})
                            </p>
                          </div>
                          <p className='text-xs text-muted-foreground'>
                            {ticketWave.name}
                          </p>
                          <p className='text-muted-foreground'>Cancelado</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>

      <CardFooter className='flex flex-col gap-2 border-t pt-4'>
        <div className='flex w-full items-center justify-between text-xs text-muted-foreground'>
          <div>
            <p>Publicado: {createdDate.toLocaleDateString('es-ES')}</p>
            {soldDate && <p>Vendido: {soldDate.toLocaleDateString('es-ES')}</p>}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
