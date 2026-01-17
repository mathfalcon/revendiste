import {Button} from '~/components/ui/button';
import {Card, CardContent} from '~/components/ui/card';
import {OrderSummary} from './OrderSummary';
import type {TicketSelectionFormValues, TicketWave} from './types';

interface DesktopSummaryCardProps {
  ticketSelection: TicketSelectionFormValues;
  ticketWaves: TicketWave[];
  isPending: boolean;
  isLoaded: boolean;
}

export function DesktopSummaryCard({
  ticketSelection,
  ticketWaves,
  isPending,
  isLoaded,
}: DesktopSummaryCardProps) {
  return (
    <Card className='overflow-hidden hidden md:block'>
      <div className='px-4 py-3 bg-muted/30 border-b'>
        <h3 className='font-semibold'>Resumen de compra</h3>
      </div>
      <CardContent className='p-4 space-y-4'>
        <OrderSummary
          ticketSelection={ticketSelection}
          ticketWaves={ticketWaves}
        />

        {/* Desktop Purchase Button */}
        <Button
          type='submit'
          className='w-full bg-primary-gradient h-12 text-base font-semibold'
          disabled={isPending || !isLoaded}
        >
          {isPending ? 'Procesando...' : 'Comprar'}
        </Button>
      </CardContent>
    </Card>
  );
}
