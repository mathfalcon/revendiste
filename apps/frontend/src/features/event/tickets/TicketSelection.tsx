import {Ticket} from 'lucide-react';
import {Form} from '~/components/ui/form';
import type {GetEventByIdResponse} from '~/lib';
import {useTicketSelection} from './useTicketSelection';
import {TicketWaveCard} from './TicketWaveCard';
import {DesktopSummaryCard} from './DesktopSummaryCard';
import {MobilePurchaseBar} from './MobilePurchaseBar';
import {NoTicketsAvailable} from './NoTicketsAvailable';

interface TicketSelectionProps {
  ticketWaves: GetEventByIdResponse['ticketWaves'];
  eventId: string;
}

export function TicketSelection({ticketWaves, eventId}: TicketSelectionProps) {
  const {
    form,
    ticketSelection,
    totalSelectedTickets,
    updateTicketCount,
    onSubmit,
    isLoaded,
    isPending,
  } = useTicketSelection({eventId, ticketWaves});

  // Filter ticket waves that have available tickets
  const availableTicketWaves = ticketWaves.filter(ticketWave =>
    ticketWave.priceGroups.some(group => Number(group.availableTickets) > 0),
  );

  if (availableTicketWaves.length === 0) {
    return <NoTicketsAvailable eventId={eventId} />;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex flex-col gap-6'
      >
        <div className='flex flex-col gap-4'>
          <div className='flex items-center gap-2'>
            <Ticket className='w-5 h-5 text-primary' />
            <h2 className='font-semibold text-lg'>Entradas disponibles</h2>
          </div>
          <div className='space-y-3'>
            {availableTicketWaves.map(ticketWave => (
              <TicketWaveCard
                key={ticketWave.id}
                mode='form'
                ticketWave={ticketWave}
                updateTicketCount={updateTicketCount}
              />
            ))}
          </div>
        </div>

        {/* Desktop Summary Card */}
        {totalSelectedTickets > 0 && (
          <DesktopSummaryCard
            ticketSelection={ticketSelection}
            ticketWaves={ticketWaves}
            isPending={isPending}
            isLoaded={isLoaded}
          />
        )}

        {/* Mobile Sticky Purchase Bar */}
        {totalSelectedTickets > 0 && (
          <MobilePurchaseBar
            ticketSelection={ticketSelection}
            ticketWaves={ticketWaves}
            totalSelectedTickets={totalSelectedTickets}
            isPending={isPending}
            isLoaded={isLoaded}
          />
        )}
      </form>
    </Form>
  );
}
