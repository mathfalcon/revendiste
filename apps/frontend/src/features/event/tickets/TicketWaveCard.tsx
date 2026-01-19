import {useFormContext} from 'react-hook-form';
import {Button} from '~/components/ui/button';
import {Card} from '~/components/ui/card';
import {MinusIcon, PlusIcon, Ticket} from 'lucide-react';
import {formatPrice} from '~/utils';
import {cn} from '~/lib/utils';
import type {TicketSelectionFormValues, TicketWave} from './types';
import type {EventTicketCurrency} from '~/lib/api/generated';

/**
 * Props for form mode (event page - selecting tickets)
 */
interface FormModeProps {
  mode: 'form';
  ticketWave: TicketWave;
  updateTicketCount: (
    ticketWaveId: string,
    priceGroupPrice: string,
    availableTickets: number,
    delta: number,
  ) => void;
}

/**
 * Props for readonly mode (checkout/order pages - displaying selected tickets)
 */
interface ReadonlyModeProps {
  mode: 'readonly';
  ticketWaveName: string;
  currency: EventTicketCurrency;
  items: Array<{
    id?: string;
    quantity: number;
    pricePerTicket: number | string;
    subtotal: number | string;
  }>;
}

type TicketWaveCardProps = FormModeProps | ReadonlyModeProps;

/**
 * A unified ticket wave card component that works in two modes:
 * - 'form': For the event page with +/- buttons to select ticket quantities
 * - 'readonly': For checkout/order pages to display selected tickets
 */
export function TicketWaveCard(props: TicketWaveCardProps) {
  if (props.mode === 'readonly') {
    return <ReadonlyTicketWaveCard {...props} />;
  }

  return <FormTicketWaveCard {...props} />;
}

/**
 * Readonly version for checkout and order pages
 */
function ReadonlyTicketWaveCard({
  ticketWaveName,
  currency,
  items,
}: ReadonlyModeProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card className='overflow-hidden rounded-md'>
      {/* Header */}
      <div className='px-3 sm:px-4 py-2 sm:py-3 bg-muted/30 border-b'>
        <h3 className='font-semibold text-sm sm:text-base'>{ticketWaveName}</h3>
      </div>

      {/* Items */}
      <div className='divide-y'>
        {items.map((item, index) => (
          <div
            key={item.id || index}
            className='flex items-center justify-between p-3 sm:p-4'
          >
            <div className='flex items-center gap-2 sm:gap-3'>
              <div className='flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10'>
                <Ticket className='h-4 w-4 sm:h-5 sm:w-5 text-primary' />
              </div>
              <div className='flex flex-col'>
                <span className='font-medium text-sm sm:text-base'>
                  {item.quantity} {item.quantity === 1 ? 'entrada' : 'entradas'}
                </span>
                <span className='text-xs sm:text-sm text-muted-foreground'>
                  {formatPrice(Number(item.pricePerTicket), currency)} c/u
                </span>
              </div>
            </div>

            <div className='text-right'>
              <span className='font-semibold text-base sm:text-lg'>
                {formatPrice(Number(item.subtotal), currency)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Form version for the event page with +/- controls
 */
function FormTicketWaveCard({ticketWave, updateTicketCount}: FormModeProps) {
  const form = useFormContext<TicketSelectionFormValues>();

  // Filter price groups that have available tickets
  const availablePriceGroups = ticketWave.priceGroups.filter(
    group => Number(group.availableTickets) > 0,
  );

  if (availablePriceGroups.length === 0) {
    return null;
  }

  // Check if any tickets are selected in this wave
  const waveSelection = form.watch(ticketWave.id) || {};
  const hasSelection = Object.values(waveSelection).some(count => count > 0);

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all rounded-md',
        hasSelection && 'ring-2 ring-primary/20 border-primary/30',
      )}
    >
      {/* Header */}
      <div className='px-4 py-3 bg-muted/30 border-b'>
        <h3 className='font-semibold text-base'>{ticketWave.name}</h3>
        {ticketWave.description && (
          <p className='text-sm text-muted-foreground mt-0.5'>
            {ticketWave.description}
          </p>
        )}
      </div>

      {/* Price Groups */}
      <div className='divide-y'>
        {availablePriceGroups.map(priceGroup => {
          const priceGroupPrice = priceGroup.price;
          const availableTickets = Number(priceGroup.availableTickets);
          const selectedCount =
            form.watch(`${ticketWave.id}.${priceGroupPrice}`) || 0;
          const isSelected = selectedCount > 0;

          return (
            <div
              key={`${ticketWave.id}-${priceGroupPrice}`}
              className={cn(
                'flex items-center justify-between p-4 transition-colors',
                isSelected && 'bg-primary/5',
              )}
            >
              <div className='flex flex-col gap-0.5'>
                <span className='font-semibold text-lg'>
                  {formatPrice(
                    parseFloat(priceGroup.price),
                    ticketWave.currency,
                  )}
                </span>
                <span className='text-xs text-muted-foreground'>
                  {availableTickets === 1
                    ? '1 disponible'
                    : `${availableTickets} disponibles`}
                </span>
              </div>

              <div className='flex items-center gap-1'>
                <Button
                  variant='outline'
                  size='icon'
                  type='button'
                  onClick={() =>
                    updateTicketCount(
                      ticketWave.id,
                      priceGroupPrice,
                      availableTickets,
                      -1,
                    )
                  }
                  disabled={selectedCount === 0}
                  className='h-9 w-9 rounded-full'
                >
                  <MinusIcon className='h-4 w-4' />
                </Button>

                <span
                  className={cn(
                    'w-10 text-center font-medium text-lg tabular-nums',
                    isSelected ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {selectedCount}
                </span>

                <Button
                  variant='outline'
                  size='icon'
                  type='button'
                  onClick={() =>
                    updateTicketCount(
                      ticketWave.id,
                      priceGroupPrice,
                      availableTickets,
                      1,
                    )
                  }
                  disabled={selectedCount >= availableTickets}
                  className='h-9 w-9 rounded-full'
                >
                  <PlusIcon className='h-4 w-4' />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
