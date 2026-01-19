import {formatPrice, calculateOrderFees} from '~/utils';
import type {TicketSelectionFormValues, TicketWave} from './types';

interface OrderSummaryProps {
  ticketSelection: TicketSelectionFormValues;
  ticketWaves: TicketWave[];
  showTotal?: boolean;
}

export function OrderSummary({
  ticketSelection,
  ticketWaves,
  showTotal = true,
}: OrderSummaryProps) {
  const {subtotalAmount, currency} = calculateSubtotal(
    ticketSelection,
    ticketWaves,
  );

  if (!currency) return null;

  const commissionBreakdown = calculateOrderFees(subtotalAmount);

  return (
    <>
      {/* Selected Items */}
      <div className='space-y-2'>
        {Object.entries(ticketSelection).map(([ticketWaveId, priceGroups]) => {
          const ticketWave = ticketWaves.find(wave => wave.id === ticketWaveId);
          if (!ticketWave) return null;

          return Object.entries(priceGroups).map(([price, quantity]) => {
            if (quantity === 0) return null;

            const unitPrice = parseFloat(price);
            const totalPrice = unitPrice * quantity;

            return (
              <div
                key={`summary-${ticketWaveId}-${price}`}
                className='flex justify-between items-start gap-4'
              >
                <div className='flex flex-col min-w-0'>
                  <span className='font-medium text-sm truncate'>
                    {ticketWave.name}
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    {quantity} × {formatPrice(unitPrice, ticketWave.currency)}
                  </span>
                </div>
                <span className='font-semibold text-sm whitespace-nowrap'>
                  {formatPrice(totalPrice, ticketWave.currency)}
                </span>
              </div>
            );
          });
        })}
      </div>

      {/* Fee Breakdown */}
      <div className='space-y-1.5 pt-2 border-t'>
        <div className='flex justify-between items-center text-sm'>
          <span className='text-muted-foreground'>Subtotal</span>
          <span>{formatPrice(subtotalAmount, currency)}</span>
        </div>
        <div className='flex justify-between items-center text-sm'>
          <span className='text-muted-foreground'>
            Comisión de plataforma (6%)
          </span>
          <span>
            {formatPrice(commissionBreakdown.platformCommission, currency)}
          </span>
        </div>
        <div className='flex justify-between items-center text-sm'>
          <span className='text-muted-foreground'>IVA sobre comisión (22%)</span>
          <span>
            {formatPrice(commissionBreakdown.vatOnCommission, currency)}
          </span>
        </div>
        {showTotal && (
          <div className='flex justify-between items-center font-bold text-lg pt-2 border-t'>
            <span>Total</span>
            <span className='text-primary'>
              {formatPrice(commissionBreakdown.totalAmount, currency)}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

// Helper function to calculate subtotal
function calculateSubtotal(
  ticketSelection: TicketSelectionFormValues,
  ticketWaves: TicketWave[],
) {
  const subtotalAmount = Object.entries(ticketSelection).reduce(
    (total, [ticketWaveId, priceGroups]) => {
      const ticketWave = ticketWaves.find(wave => wave.id === ticketWaveId);
      if (!ticketWave) return total;

      return (
        total +
        Object.entries(priceGroups).reduce((waveTotal, [price, quantity]) => {
          return waveTotal + parseFloat(price) * quantity;
        }, 0)
      );
    },
    0,
  );

  const firstWave = ticketWaves.find(
    wave =>
      ticketSelection[wave.id] &&
      Object.values(ticketSelection[wave.id] || {}).some(qty => qty > 0),
  );
  const currency = firstWave?.currency;

  return {subtotalAmount, currency};
}

// Export for use in other components
export {calculateSubtotal};
