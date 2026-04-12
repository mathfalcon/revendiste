import {Ticket, TicketPlus} from 'lucide-react';
import {Form} from '~/components/ui/form';
import type {GetEventByIdResponse} from '~/lib';
import {useTicketSelection} from './useTicketSelection';
import {TicketWaveCard} from './TicketWaveCard';
import {DesktopSummaryCard} from './DesktopSummaryCard';
import {MobilePurchaseBar} from './MobilePurchaseBar';
import {NoTicketsAvailable} from './NoTicketsAvailable';
import {Link} from '@tanstack/react-router';

interface TicketSelectionProps {
  ticketWaves: GetEventByIdResponse['ticketWaves'];
  eventId: string;
  userListingsCount?: number;
}

export function TicketSelection({
  ticketWaves,
  eventId,
  userListingsCount,
}: TicketSelectionProps) {
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
    return (
      <NoTicketsAvailable
        eventId={eventId}
        userListingsCount={userListingsCount}
      />
    );
  }

  return (
    <>
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

      {/* Sell CTA */}
      <Link
        to='/entradas/publicar'
        search={{eventoId: eventId}}
        className='flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-2'
      >
        <TicketPlus className='w-4 h-4' />
        <span>¿Tenés entradas? Publicalas acá</span>
      </Link>
    </>
  );
}
