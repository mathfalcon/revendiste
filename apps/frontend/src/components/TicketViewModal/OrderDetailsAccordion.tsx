import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {Separator} from '~/components/ui/separator';

interface OrderDetailsAccordionProps {
  subtotalAmount?: string | null;
  totalAmount?: string | null;
  platformCommission?: string | null;
  vatOnCommission?: string | null;
  currency?: string | null;
}

export function OrderDetailsAccordion({
  subtotalAmount,
  totalAmount,
  platformCommission,
  vatOnCommission,
  currency,
}: OrderDetailsAccordionProps) {
  if (
    !subtotalAmount ||
    !totalAmount ||
    !platformCommission ||
    !vatOnCommission
  ) {
    return null;
  }

  return (
    <Accordion type='single' collapsible className='w-full'>
      <AccordionItem value='order-details'>
        <AccordionTrigger>Detalles de la orden</AccordionTrigger>
        <AccordionContent>
          <div className='space-y-3 pt-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Subtotal:</span>
              <span className='font-medium'>
                {new Intl.NumberFormat('es-UY', {
                  style: 'currency',
                  currency: currency || 'UYU',
                }).format(Number(subtotalAmount))}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>
                Comisión de plataforma:
              </span>
              <span className='font-medium'>
                {new Intl.NumberFormat('es-UY', {
                  style: 'currency',
                  currency: currency || 'UYU',
                }).format(Number(platformCommission))}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>IVA sobre comisión:</span>
              <span className='font-medium'>
                {new Intl.NumberFormat('es-UY', {
                  style: 'currency',
                  currency: currency || 'UYU',
                }).format(Number(vatOnCommission))}
              </span>
            </div>
            <Separator />
            <div className='flex justify-between text-sm font-semibold'>
              <span>Total:</span>
              <span>
                {new Intl.NumberFormat('es-UY', {
                  style: 'currency',
                  currency: currency || 'UYU',
                }).format(Number(totalAmount))}
              </span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

