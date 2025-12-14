import {useQuery} from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {Button} from '~/components/ui/button';
import {ChevronLeft, ChevronRight, Download, AlertCircle} from 'lucide-react';
import {getOrderTicketsQuery} from '~/lib/api/order';
import {LoadingSpinner} from '~/components/LoadingScreen';
import {useState} from 'react';
import {Card, CardContent} from '~/components/ui/card';
import {Alert, AlertDescription} from '~/components/ui/alert';
import {TextEllipsis} from '~/components/ui/text-ellipsis';
import {TicketDetails} from './TicketDetails';
import {TicketImagePreview} from './TicketImagePreview';
import {OrderDetailsAccordion} from './OrderDetailsAccordion';
import {TicketIds} from './TicketIds';
import {TicketDocumentStatus} from './TicketDocumentStatus';
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
      // Create a temporary anchor element to trigger download
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
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {event?.name ? (
              <TextEllipsis maxLines={1} className='text-lg font-semibold'>
                {event.name}
              </TextEllipsis>
            ) : (
              'Mis tickets'
            )}
          </DialogTitle>
        </DialogHeader>

        {isPending ? (
          <div className='flex h-64 items-center justify-center'>
            <LoadingSpinner size={64} />
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
            {/* Ticket counter */}
            {hasMultipleTickets && (
              <div className='text-center text-sm text-muted-foreground'>
                Ticket {currentIndex + 1} de {tickets.length}
              </div>
            )}

            {/* Ticket content */}
            <Card>
              <CardContent className='p-6'>
                <div className='space-y-4'>
                  <TicketDetails
                    ticketWaveName={currentTicket.ticketWave?.name}
                    eventStartDate={event?.eventStartDate || null}
                    price={currentTicket.price}
                    currency={currency || null}
                  />
                  <TicketDocumentStatus
                    hasDocument={currentTicket.hasDocument}
                  />

                  {currentTicket.hasDocument && (
                    <>
                      {currentTicket.document?.url && (
                        <TicketImagePreview
                          url={currentTicket.document.url}
                          ticketId={currentTicket.id}
                          mimeType={currentTicket.document.mimeType}
                        />
                      )}

                      <Button
                        onClick={handleDownload}
                        className='w-full'
                        variant='default'
                      >
                        <Download className='mr-2 h-4 w-4' />
                        Descargar ticket
                      </Button>
                    </>
                  )}

                  <OrderDetailsAccordion
                    subtotalAmount={subtotalAmount || null}
                    totalAmount={totalAmount || null}
                    platformCommission={platformCommission || null}
                    vatOnCommission={vatOnCommission || null}
                    currency={currency || null}
                  />

                  <TicketIds
                    orderId={orderIdFromData || null}
                    ticketId={currentTicket.id}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Navigation buttons */}
            {hasMultipleTickets && (
              <div className='flex justify-between gap-2'>
                <Button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  variant='outline'
                  className='flex-1'
                >
                  <ChevronLeft className='mr-2 h-4 w-4' />
                  Anterior
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={currentIndex === tickets.length - 1}
                  variant='outline'
                  className='flex-1'
                >
                  Siguiente
                  <ChevronRight className='ml-2 h-4 w-4' />
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
