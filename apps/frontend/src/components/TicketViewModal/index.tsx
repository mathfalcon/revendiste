import {useQuery} from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {Button} from '~/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Ticket,
  FileCheck,
  Clock,
} from 'lucide-react';
import {getOrderTicketsQuery} from '~/lib/api/order';
import {useState} from 'react';
import {Alert, AlertDescription} from '~/components/ui/alert';
import {TextEllipsis} from '~/components/ui/text-ellipsis';
import {TicketDetails} from './TicketDetails';
import {OrderDetailsAccordion} from './OrderDetailsAccordion';
import {TicketIds} from './TicketIds';
import {DocumentPreview} from './DocumentPreview';
import {getFullFileUrl} from './utils';

interface TicketViewModalProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TicketViewModal({
  orderId,
  open,
  onOpenChange,
}: TicketViewModalProps) {
  const {data: orderTicketsData, isPending} = useQuery(
    getOrderTicketsQuery(orderId),
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  const tickets = orderTicketsData?.tickets;
  const event = orderTicketsData?.event;
  const orderIdFromData = orderTicketsData?.orderId;
  const subtotalAmount = orderTicketsData?.subtotalAmount;
  const totalAmount = orderTicketsData?.totalAmount;
  const platformCommission = orderTicketsData?.platformCommission;
  const vatOnCommission = orderTicketsData?.vatOnCommission;
  const currency = orderTicketsData?.currency;
  const currentTicket = tickets?.[currentIndex];
  const hasMultipleTickets = (tickets?.length || 0) > 1;

  const handleNext = () => {
    if (tickets && currentIndex < tickets.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (tickets && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDownload = () => {
    if (currentTicket?.document?.url) {
      const fullUrl = getFullFileUrl(currentTicket.document.url);
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = `ticket-${currentTicket.id}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Ticket className='h-5 w-5' />
            {event?.name ? (
              <TextEllipsis maxLines={1} className='text-lg font-semibold'>
                {event.name}
              </TextEllipsis>
            ) : (
              'Mis tickets'
            )}
          </DialogTitle>
          {currentTicket && (
            <DialogDescription>
              {currentTicket.ticketWave?.name}
              {hasMultipleTickets && ` • Ticket ${currentIndex + 1} de ${tickets?.length}`}
            </DialogDescription>
          )}
        </DialogHeader>

        {isPending ? (
          <div className='flex items-center justify-center py-12'>
            <div className='h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
          </div>
        ) : !tickets || tickets.length === 0 ? (
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              No se encontraron tickets para esta orden
            </AlertDescription>
          </Alert>
        ) : !currentTicket ? (
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              No se pudo cargar el ticket seleccionado
            </AlertDescription>
          </Alert>
        ) : (
          <div className='space-y-4'>
            {/* Ticket details */}
            <TicketDetails
              ticketWaveName={currentTicket.ticketWave?.name}
              eventStartDate={event?.eventStartDate || null}
              price={currentTicket.price}
              currency={currency || null}
            />

            {/* Document section */}
            {currentTicket.hasDocument && currentTicket.document?.url ? (
              <div className='space-y-3'>
                {/* Document status */}
                <div className='flex items-center gap-2 text-sm'>
                  <FileCheck className='h-4 w-4 text-green-500' />
                  <span className='text-green-600 font-medium'>
                    Ticket disponible
                  </span>
                </div>

                {/* Document preview */}
                <DocumentPreview
                  url={currentTicket.document.url}
                  ticketId={currentTicket.id}
                  mimeType={currentTicket.document.mimeType}
                  onDownload={handleDownload}
                />
              </div>
            ) : (
              <Alert className='bg-muted/50'>
                <Clock className='h-4 w-4' />
                <AlertDescription>
                  El vendedor aún no ha subido el ticket. Te notificaremos cuando
                  esté disponible.
                </AlertDescription>
              </Alert>
            )}

            {/* Order details accordion */}
            <OrderDetailsAccordion
              subtotalAmount={subtotalAmount || null}
              totalAmount={totalAmount || null}
              platformCommission={platformCommission || null}
              vatOnCommission={vatOnCommission || null}
              currency={currency || null}
            />

            {/* Ticket IDs */}
            <TicketIds orderId={orderIdFromData || null} ticketId={currentTicket.id} />

            {/* Navigation buttons */}
            {hasMultipleTickets && (
              <div className='flex justify-between gap-2 pt-2'>
                <Button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  variant='outline'
                  className='flex-1'
                >
                  <ChevronLeft className='h-4 w-4' />
                  Anterior
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={currentIndex === tickets.length - 1}
                  variant='outline'
                  className='flex-1'
                >
                  Siguiente
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
