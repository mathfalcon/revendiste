import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {Separator} from '~/components/ui/separator';
import {TicketIds} from './TicketIds';

interface SlideDetailsAccordionProps {
  ticketId: string;
  orderId?: string | null;
  ticketWaveName?: string | null;
  price: string;
  currency?: string | null;
  subtotalAmount?: string | null;
  totalAmount?: string | null;
  platformCommission?: string | null;
  vatOnCommission?: string | null;
}

function formatCurrency(amount: string, currency: string | null | undefined) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: currency || 'UYU',
  }).format(Number(amount));
}

export function SlideDetailsAccordion({
  ticketId,
  orderId,
  ticketWaveName,
  price,
  currency,
  subtotalAmount,
  totalAmount,
  platformCommission,
  vatOnCommission,
}: SlideDetailsAccordionProps) {
  const hasOrderDetails =
    subtotalAmount && totalAmount && platformCommission && vatOnCommission;

  return (
    <Accordion type='single' collapsible className='w-full'>
      <AccordionItem value='details' className='border-b-0'>
        <AccordionTrigger className='text-sm py-2'>
          Más detalles
        </AccordionTrigger>
        <AccordionContent>
          <div className='space-y-3 pt-1'>
            {/* IDs */}
            <TicketIds orderId={orderId} ticketId={ticketId} />

            <Separator />

            {/* Ticket info */}
            <div className='space-y-1'>
              {ticketWaveName && (
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Categoría</span>
                  <span className='font-medium'>{ticketWaveName}</span>
                </div>
              )}
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Precio</span>
                <span className='font-medium'>
                  {formatCurrency(price, currency)}
                </span>
              </div>
            </div>

            {/* Order breakdown */}
            {hasOrderDetails && (
              <>
                <Separator />
                <div className='space-y-1'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Subtotal</span>
                    <span className='font-medium'>
                      {formatCurrency(subtotalAmount, currency)}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>
                      Comisión de plataforma
                    </span>
                    <span className='font-medium'>
                      {formatCurrency(platformCommission, currency)}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>
                      IVA sobre comisión
                    </span>
                    <span className='font-medium'>
                      {formatCurrency(vatOnCommission, currency)}
                    </span>
                  </div>
                  <Separator />
                  <div className='flex justify-between text-sm font-semibold'>
                    <span>Total</span>
                    <span>{formatCurrency(totalAmount, currency)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
