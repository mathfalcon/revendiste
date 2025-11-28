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
  Upload,
  FileCheck,
  AlertCircle,
  Timer,
} from 'lucide-react';
import {Link, useNavigate} from '@tanstack/react-router';
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
  const navigate = useNavigate({from: '/cuenta/publicaciones'});

  const startDate = new Date(event.eventStartDate);
  const endDate = new Date(event.eventEndDate);
  const createdDate = new Date(createdAt);
  const soldDate = soldAt ? new Date(soldAt) : null;

  const handleUploadClick = (ticketId: string) => {
    navigate({
      search: prev => ({
        ...prev,
        subirTicket: ticketId,
      }),
    });
  };

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
                  {soldTickets.map(ticket => {
                    const hasDocument = ticket.hasDocument;
                    const canUpload = ticket.canUploadDocument;
                    const documentNeedsAttention = false; // For future: check if status is 'rejected' or 'pending'

                    // Determine button state
                    let buttonConfig: {
                      bgClass: string;
                      icon: React.ReactNode;
                      text: string;
                      onClick: () => void;
                      disabled: boolean;
                      title?: string;
                    };

                    if (!canUpload) {
                      // Can't upload yet (too early based on platform rules)
                      buttonConfig = {
                        bgClass:
                          'bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed',
                        icon: <Timer className='h-3.5 w-3.5' />,
                        text: 'Próximamente',
                        onClick: () => {},
                        disabled: true,
                        title:
                          'Los tickets estarán disponibles 12 horas antes del evento',
                      };
                    } else if (hasDocument) {
                      // Has document - show edit/update option
                      if (documentNeedsAttention) {
                        buttonConfig = {
                          bgClass:
                            'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300',
                          icon: <AlertCircle className='h-3.5 w-3.5' />,
                          text: 'Revisar',
                          onClick: () => handleUploadClick(ticket.id),
                          disabled: false,
                        };
                      } else {
                        buttonConfig = {
                          bgClass:
                            'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300',
                          icon: <FileCheck className='h-3.5 w-3.5' />,
                          text: 'Editar',
                          onClick: () => handleUploadClick(ticket.id),
                          disabled: false,
                        };
                      }
                    } else {
                      // No document and can upload - show upload prompt
                      buttonConfig = {
                        bgClass:
                          'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300',
                        icon: <Upload className='h-3.5 w-3.5' />,
                        text: 'Subir ticket',
                        onClick: () => handleUploadClick(ticket.id),
                        disabled: false,
                      };
                    }

                    return (
                      <div
                        key={ticket.id}
                        className='rounded-lg border border-green-200 bg-muted/50 p-3 text-sm'
                      >
                        <div className='flex items-start justify-between gap-3'>
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
                              Vendido por:{' '}
                              {formatPrice(
                                parseFloat(ticket.price),
                                ticketWave.currency,
                              )}
                            </p>
                          </div>

                          {/* Upload Document Button */}
                          <button
                            onClick={buttonConfig.onClick}
                            disabled={buttonConfig.disabled}
                            title={buttonConfig.title}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${buttonConfig.bgClass}`}
                          >
                            {buttonConfig.icon}
                            {buttonConfig.text}
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
