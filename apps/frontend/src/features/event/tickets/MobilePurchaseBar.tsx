import {useState, useEffect} from 'react';
import {Button} from '~/components/ui/button';
import {ChevronUp} from 'lucide-react';
import {formatPrice, calculateOrderFees} from '~/utils';
import {cn} from '~/lib/utils';
import {OrderSummary, calculateSubtotal} from './OrderSummary';
import type {TicketSelectionFormValues, TicketWave} from './types';
import {useStickyBar} from '~/contexts';

interface MobilePurchaseBarProps {
  ticketSelection: TicketSelectionFormValues;
  ticketWaves: TicketWave[];
  totalSelectedTickets: number;
  isPending: boolean;
  isLoaded: boolean;
}

export function MobilePurchaseBar({
  ticketSelection,
  ticketWaves,
  totalSelectedTickets,
  isPending,
  isLoaded,
}: MobilePurchaseBarProps) {
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const {registerStickyBar} = useStickyBar();

  const {subtotalAmount, currency} = calculateSubtotal(
    ticketSelection,
    ticketWaves,
  );

  // Register this sticky bar when mounted
  useEffect(() => {
    const unregister = registerStickyBar();
    return unregister;
  }, [registerStickyBar]);

  // Disable body scroll when summary is expanded
  useEffect(() => {
    if (isSummaryExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSummaryExpanded]);

  if (!currency) return null;

  const commissionBreakdown = calculateOrderFees(subtotalAmount);
  const totalAmount = formatPrice(commissionBreakdown.totalAmount, currency);

  const toggleSummary = () => setIsSummaryExpanded(!isSummaryExpanded);

  return (
    <>
      {/* Backdrop overlay when summary is expanded */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300',
          isSummaryExpanded
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setIsSummaryExpanded(false)}
      />

      <div className='fixed bottom-0 left-0 right-0 z-50 md:hidden'>
        <div
          className={cn(
            'bg-background border-t safe-area-inset-bottom transition-shadow duration-300',
            isSummaryExpanded ? 'shadow-2xl' : 'shadow-lg',
          )}
        >
          {/* Expandable Summary */}
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-in-out',
              isSummaryExpanded ? 'max-h-96' : 'max-h-0',
            )}
          >
            <div className='px-4 pt-4 pb-2 space-y-3 border-b'>
              <OrderSummary
                ticketSelection={ticketSelection}
                ticketWaves={ticketWaves}
                showTotal={false}
              />
            </div>
          </div>

          {/* Main Bar - entire area is clickable except the button */}
          <div
            className='px-4 py-3 cursor-pointer'
            onClick={toggleSummary}
          >
            <div className='flex items-center justify-between gap-4'>
              <div className='flex flex-col min-w-0 text-left flex-1'>
                <div className='flex items-center gap-1.5'>
                  <span className='text-xs text-muted-foreground'>
                    Total ({totalSelectedTickets}{' '}
                    {totalSelectedTickets === 1 ? 'entrada' : 'entradas'})
                  </span>
                  <ChevronUp
                    className={cn(
                      'w-3.5 h-3.5 text-muted-foreground transition-transform duration-300',
                      isSummaryExpanded && 'rotate-180',
                    )}
                  />
                </div>
                <span className='font-bold text-lg text-primary'>
                  {totalAmount}
                </span>
              </div>
              <Button
                type='submit'
                className='bg-primary-gradient h-12 px-8 text-base font-semibold'
                disabled={isPending || !isLoaded}
                onClick={e => e.stopPropagation()}
              >
                {isPending ? 'Procesando...' : 'Comprar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
