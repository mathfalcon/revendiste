import {useQuery} from '@tanstack/react-query';
import {Link, useNavigate} from '@tanstack/react-router';
import {ANALYTICS_EVENTS, trackEvent} from '~/lib/analytics';
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
import {AlertCircle, Ticket, ChevronLeft, ChevronRight} from 'lucide-react';
import {Button} from '~/components/ui/button';
import {getOrderTicketsQuery} from '~/lib/api/order';

import {api} from '~/lib/api';
import {useState, useMemo, useEffect, useCallback, useRef} from 'react';
import {Alert, AlertDescription} from '~/components/ui/alert';
import {TextEllipsis} from '~/components/ui/text-ellipsis';
import {getFullFileUrl} from './utils';
import {CreateCaseDialog} from '~/components/CreateCaseDialog';
import {cn} from '~/lib/utils';
import {TicketSlide, type OrderTicket} from './TicketSlide';

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
  const {data: orderTicketsData, isPending} = useQuery({
    ...getOrderTicketsQuery(orderId),
    enabled: open && !!orderId,
  });
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
      trackEvent(ANALYTICS_EVENTS.TICKET_DOCUMENT_DOWNLOADED, {
        ticket_id: ticket.id,
        order_id: orderId,
        mime_type: ticket.document.mimeType,
      });
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
          <DialogTitle className='flex items-center gap-2'>
            <Ticket className='h-5 w-5 shrink-0' />
            {event?.name ? (
              <TextEllipsis maxLines={1} className='text-lg font-semibold'>
                {event.name}
              </TextEllipsis>
            ) : (
              'Mis entradas'
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
          <div className='space-y-3'>
            {/* Navigation: arrows + counter (only for multiple tickets) */}
            {hasMultipleTickets && (
              <div className='flex items-center justify-between gap-2'>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-9 w-9 shrink-0 touch-manipulation'
                  onClick={() => carouselApi?.scrollPrev()}
                  disabled={!canScrollPrev}
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <div className='flex flex-col items-center gap-1.5 min-w-0 flex-1'>
                  <span className='text-sm font-medium tabular-nums'>
                    {selectedIndex + 1} / {sortedTickets.length}
                  </span>
                  {/* Dot indicators */}
                  <div className='flex items-center gap-1.5'>
                    {sortedTickets.map((_, idx) => (
                      <button
                        key={idx}
                        type='button'
                        className={cn(
                          'h-2 rounded-full transition-all duration-200 touch-manipulation',
                          idx === selectedIndex
                            ? 'w-5 bg-primary'
                            : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50',
                        )}
                        onClick={() => carouselApi?.scrollTo(idx)}
                        aria-label={`Ir a entrada ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-9 w-9 shrink-0 touch-manipulation'
                  onClick={() => carouselApi?.scrollNext()}
                  disabled={!canScrollNext}
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            )}

            {hasMultipleTickets ? (
              <Carousel
                setApi={setCarouselApi}
                opts={{
                  align: 'start',
                  loop: false,
                  dragFree: false,
                  watchDrag: (_, event) => 'touches' in event,
                }}
                className='w-full'
              >
                <CarouselContent className='-ml-4'>
                  {sortedTickets.map(ticket => (
                    <CarouselItem key={ticket.id} className='pl-4'>
                      <TicketSlide
                        ticket={ticket}
                        orderIdFromData={orderIdFromData}
                        currency={currency}
                        subtotalAmount={subtotalAmount}
                        totalAmount={totalAmount}
                        platformCommission={platformCommission}
                        vatOnCommission={vatOnCommission}
                        isReportPending={isReportPending}
                        onDownload={handleDownload}
                        onReport={handleReportClick}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            ) : currentTicket ? (
              <TicketSlide
                ticket={currentTicket}
                orderIdFromData={orderIdFromData}
                currency={currency}
                subtotalAmount={subtotalAmount}
                totalAmount={totalAmount}
                platformCommission={platformCommission}
                vatOnCommission={vatOnCommission}
                isReportPending={isReportPending}
                onDownload={handleDownload}
                onReport={handleReportClick}
              />
            ) : null}
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
