import {useQuery} from '@tanstack/react-query';
import {Link, useNavigate} from '@tanstack/react-router';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '~/components/ui/carousel';
import {
  AlertCircle,
  Ticket,
  FileCheck,
  Clock,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
} from 'lucide-react';
import {Button} from '~/components/ui/button';
import {getOrderTicketsQuery} from '~/lib/api/order';
import type {GetOrderTicketsResponse} from '~/lib/api/generated';
import {api} from '~/lib/api';
import {useState, useMemo, useEffect, useCallback, useRef} from 'react';
import {Alert, AlertDescription} from '~/components/ui/alert';
import {TextEllipsis} from '~/components/ui/text-ellipsis';
import {TicketDetails} from './TicketDetails';
import {OrderDetailsAccordion} from './OrderDetailsAccordion';
import {TicketIds} from './TicketIds';
import {DocumentPreview} from './DocumentPreview';
import {getFullFileUrl} from './utils';
import {formatEventDateSmart} from '~/utils/string';
import {CreateCaseDialog} from '~/components/CreateCaseDialog';

type OrderTicket = GetOrderTicketsResponse['tickets'][number];

interface TicketViewModalProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Sort so tickets with document come first (so first view is a usable ticket when any exist). */
function sortTicketsWithDocumentFirst(tickets: OrderTicket[]): OrderTicket[] {
  return [...tickets].sort(
    (a, b) => (b.hasDocument ? 1 : 0) - (a.hasDocument ? 1 : 0),
  );
}

export function TicketViewModal({
  orderId,
  open,
  onOpenChange,
}: TicketViewModalProps) {
  const navigate = useNavigate();
  const {data: orderTicketsData, isPending} = useQuery(
    getOrderTicketsQuery(orderId),
  );
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportingTicket, setReportingTicket] = useState<{
    id: string;
    waveName: string;
    ticketIndex: number;
    hasDocument: boolean;
    price: string;
  } | null>(null);
  const [existingReportId, setExistingReportId] = useState<string | null>(null);
  const [isReportPending, setIsReportPending] = useState(false);

  const tickets = orderTicketsData?.tickets;
  const sortedTickets = useMemo(
    () => (tickets ? sortTicketsWithDocumentFirst(tickets) : []),
    [tickets],
  );
  const event = orderTicketsData?.event;
  const orderIdFromData = orderTicketsData?.orderId;
  const subtotalAmount = orderTicketsData?.subtotalAmount;
  const totalAmount = orderTicketsData?.totalAmount;
  const platformCommission = orderTicketsData?.platformCommission;
  const vatOnCommission = orderTicketsData?.vatOnCommission;
  const currency = orderTicketsData?.currency;
  const currentTicket = sortedTickets[selectedIndex];
  const hasMultipleTickets = sortedTickets.length > 1;
  const withDocumentCount = sortedTickets.filter(t => t.hasDocument).length;
  const pendingCount = sortedTickets.length - withDocumentCount;

  const updateCarouselState = useCallback((api: CarouselApi | undefined) => {
    if (!api) return;
    setSelectedIndex(api.selectedScrollSnap());
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  const updateRef = useRef(updateCarouselState);
  updateRef.current = updateCarouselState;

  useEffect(() => {
    if (!carouselApi) return;
    updateCarouselState(carouselApi);
    const handler = () => updateRef.current(carouselApi);
    carouselApi.on('select', handler);
    return () => {
      carouselApi.off('select', handler);
    };
  }, [carouselApi, updateCarouselState]);

  // Reset to first slide when modal opens or order/tickets change
  useEffect(() => {
    if (!open || sortedTickets.length === 0) return;
    setSelectedIndex(0);
    carouselApi?.scrollTo(0);
  }, [open, orderId, sortedTickets.length, carouselApi]);

  const handleDownload = (ticket: OrderTicket) => {
    if (ticket?.document?.url) {
      const fullUrl = getFullFileUrl(ticket.document.url);
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = `ticket-${ticket.id}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleReportClick = async (ticket: OrderTicket) => {
    setIsReportPending(true);
    try {
      const response = await api.ticketReports.checkExistingReport({
        entityType: 'order_ticket_reservation',
        entityId: ticket.id,
      });
      if (response.data.exists) {
        setExistingReportId(response.data.reportId!);
      } else {
        setReportingTicket({
          id: ticket.id,
          waveName: ticket.ticketWave?.name || 'Entrada',
          ticketIndex: sortedTickets.indexOf(ticket) + 1,
          hasDocument: ticket.hasDocument,
          price: ticket.price,
        });
        setShowReportDialog(true);
      }
    } catch {
      setReportingTicket({
        id: ticket.id,
        waveName: ticket.ticketWave?.name || 'Entrada',
        ticketIndex: sortedTickets.indexOf(ticket) + 1,
        hasDocument: ticket.hasDocument,
        price: ticket.price,
      });
      setShowReportDialog(true);
    } finally {
      setIsReportPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px] max-h-[calc(100dvh-2rem)] overflow-y-auto'>
        <DialogHeader className='text-left'>
          <DialogTitle className='flex flex-col gap-0.5'>
            <div className='flex items-center gap-2'>
              <Ticket className='h-5 w-5 shrink-0' />
              {event?.name ? (
                <TextEllipsis maxLines={1} className='text-lg font-semibold'>
                  {event.name}
                </TextEllipsis>
              ) : (
                'Mis tickets'
              )}
            </div>
            {event?.eventStartDate && (
              <p className='text-sm font-normal text-muted-foreground'>
                {formatEventDateSmart(event.eventStartDate)}
              </p>
            )}
            {sortedTickets.length > 0 && (
              <div className='space-y-0.5'>
                <p className='text-sm font-medium text-muted-foreground'>
                  {sortedTickets.length}{' '}
                  {sortedTickets.length === 1 ? 'entrada' : 'entradas'} en esta
                  orden
                </p>
                {hasMultipleTickets &&
                  (withDocumentCount > 0 || pendingCount > 0) && (
                    <p className='text-sm font-normal text-muted-foreground'>
                      {withDocumentCount > 0 && (
                        <span className='text-primary'>
                          {withDocumentCount} disponible
                          {withDocumentCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      {withDocumentCount > 0 && pendingCount > 0 && ', '}
                      {pendingCount > 0 &&
                        `${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''}`}
                    </p>
                  )}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {isPending ? (
          <div className='flex items-center justify-center py-12'>
            <div className='h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
          </div>
        ) : !tickets || tickets.length === 0 ? (
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              No se encontraron entradas para esta orden
            </AlertDescription>
          </Alert>
        ) : !currentTicket ? (
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              No se pudo cargar la entrada seleccionada
            </AlertDescription>
          </Alert>
        ) : (
          <div className='space-y-4'>
            {/* Carousel nav: visible on all breakpoints, touch-friendly */}
            {hasMultipleTickets && (
              <div className='flex items-center justify-between gap-2 rounded-xl border bg-muted/20 px-2 py-2 sm:px-4 sm:py-2.5'>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-10 min-w-10 shrink-0 touch-manipulation sm:h-9 sm:min-w-9'
                  onClick={() => carouselApi?.scrollPrev()}
                  disabled={!canScrollPrev}
                >
                  <ChevronLeft className='h-5 w-5 sm:h-4 sm:w-4' />
                  <span className='hidden sm:inline ml-1'>Anterior</span>
                </Button>
                <p className='text-sm font-semibold text-center min-w-0 flex-1 px-2'>
                  <span className='tabular-nums'>
                    Entrada {selectedIndex + 1} de {sortedTickets.length}
                  </span>
                  {currentTicket?.ticketWave?.name && (
                    <span className='font-normal text-muted-foreground block truncate sm:inline sm:ml-1'>
                      {currentTicket.ticketWave.name}
                    </span>
                  )}
                </p>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-10 min-w-10 shrink-0 touch-manipulation sm:h-9 sm:min-w-9'
                  onClick={() => carouselApi?.scrollNext()}
                  disabled={!canScrollNext}
                >
                  <span className='hidden sm:inline mr-1'>Siguiente</span>
                  <ChevronRight className='h-5 w-5 sm:h-4 sm:w-4' />
                </Button>
              </div>
            )}

            <Carousel
              setApi={setCarouselApi}
              opts={{align: 'start', loop: false, dragFree: false}}
              className='w-full'
            >
              <CarouselContent className='-ml-4'>
                {sortedTickets.map(ticket => (
                  <CarouselItem key={ticket.id} className='pl-4'>
                    <div className='space-y-2 pb-2'>
                      {/* Ticket details + IDs: full width, tight spacing */}
                      <TicketDetails
                        ticketWaveName={ticket.ticketWave?.name}
                        price={ticket.price}
                        currency={currency || null}
                      />
                      {/* Ticket IDs always visible (for screenshots) */}
                      <TicketIds
                        orderId={orderIdFromData || null}
                        ticketId={ticket.id}
                      />

                      <div className='pt-1' />

                      {ticket.reservationStatus === 'cancelled' ? (
                        <Alert className='bg-destructive/10 border-destructive/30'>
                          <AlertTriangle className='h-4 w-4 text-destructive' />
                          <AlertDescription className='text-destructive'>
                            <span className='font-semibold'>
                              Entrada cancelada
                            </span>{' '}
                            — El vendedor no subió el documento a tiempo. Tu
                            reembolso está en proceso.
                          </AlertDescription>
                        </Alert>
                      ) : ticket.reservationStatus === 'refunded' ? (
                        <Alert className='bg-muted/50 border-muted'>
                          <XCircle className='h-4 w-4 text-muted-foreground' />
                          <AlertDescription className='text-muted-foreground'>
                            <span className='font-semibold'>
                              Entrada reembolsada
                            </span>
                          </AlertDescription>
                        </Alert>
                      ) : ticket.reservationStatus === 'refund_pending' ? (
                        <Alert className='bg-yellow-500/10 border-yellow-500/30'>
                          <Clock className='h-4 w-4 text-yellow-600' />
                          <AlertDescription className='text-yellow-700'>
                            <span className='font-semibold'>
                              Reembolso en proceso
                            </span>
                          </AlertDescription>
                        </Alert>
                      ) : ticket.hasDocument && ticket.document?.url ? (
                        <div className='space-y-3'>
                          <div className='flex items-center gap-2 text-sm'>
                            <FileCheck className='h-4 w-4 text-green-500' />
                            <span className='text-green-600 font-medium'>
                              Entrada disponible
                            </span>
                          </div>
                          <DocumentPreview
                            url={ticket.document.url}
                            ticketId={ticket.id}
                            mimeType={ticket.document.mimeType}
                            onDownload={() => handleDownload(ticket)}
                            onReport={() => handleReportClick(ticket)}
                            isReportDisabled={isReportPending}
                          />
                        </div>
                      ) : (
                        <div className='rounded-lg border border-dashed bg-muted/30 p-6 text-center space-y-3'>
                          <div className='flex justify-center'>
                            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
                              <Clock className='h-6 w-6 text-muted-foreground' />
                            </div>
                          </div>
                          <div className='space-y-1'>
                            <p className='font-medium text-foreground'>
                              Entrada aún no disponible
                            </p>
                            <p className='text-sm text-muted-foreground'>
                              El vendedor todavía no subió el documento. Te
                              avisamos cuando esté listo.
                            </p>
                          </div>
                          {hasMultipleTickets && (
                            <p className='text-sm text-muted-foreground pt-1'>
                              Deslizá para ver otras entradas.
                            </p>
                          )}
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-8 text-xs text-muted-foreground hover:text-destructive'
                            disabled={isReportPending}
                            onClick={() => handleReportClick(ticket)}
                          >
                            <Flag className='h-3.5 w-3.5 mr-1' />
                            Reportar problema
                          </Button>
                        </div>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {/* Order details accordion */}
            <OrderDetailsAccordion
              subtotalAmount={subtotalAmount || null}
              totalAmount={totalAmount || null}
              platformCommission={platformCommission || null}
              vatOnCommission={vatOnCommission || null}
              currency={currency || null}
            />
          </div>
        )}
      </DialogContent>

      {reportingTicket && (
        <CreateCaseDialog
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          prefillContext={{
            entityType: 'order_ticket_reservation',
            entityId: reportingTicket.id,
            hasDocument: reportingTicket.hasDocument,
            details: [
              ...(event?.name ? [{label: 'Evento', value: event.name}] : []),
              {
                label: 'Entrada',
                value: `${reportingTicket.ticketIndex} de ${sortedTickets.length}`,
              },
              ...(reportingTicket.waveName !== 'Entrada'
                ? [{label: 'Tipo', value: reportingTicket.waveName}]
                : []),
              {
                label: 'Precio',
                value: `${currency ?? ''} ${reportingTicket.price}`,
              },
              ...(orderIdFromData
                ? [{label: 'Orden', value: orderIdFromData}]
                : []),
            ],
          }}
          onSuccess={reportId => {
            setShowReportDialog(false);
            onOpenChange(false);
            navigate({to: '/cuenta/reportes/$reportId', params: {reportId}});
          }}
        />
      )}

      <AlertDialog
        open={!!existingReportId}
        onOpenChange={open => !open && setExistingReportId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ya tenés un caso abierto</AlertDialogTitle>
            <AlertDialogDescription>
              Ya existe un caso abierto para esta entrada. Podés ver su estado y
              agregar comentarios desde tus reportes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Link
                to='/cuenta/reportes/$reportId'
                params={{reportId: existingReportId!}}
              >
                Ver mi caso
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
