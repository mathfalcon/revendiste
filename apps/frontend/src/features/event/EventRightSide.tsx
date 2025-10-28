import {GetEventByIdResponse} from '~/lib';
import {Button} from '~/components/ui/button';
import {formatPrice} from '~/utils';
import {MinusIcon, PlusIcon} from 'lucide-react';
import {Input} from '~/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {useForm, useFormContext, SubmitHandler} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Form} from '~/components/ui/form';
import {toast} from 'sonner';
import {calculateOrderFees} from '~/utils';

type EventRightSideProps = Pick<GetEventByIdResponse, 'ticketWaves'>;

// Schema for ticket selection form
const TicketSelectionSchema = z.record(
  z.string(), // ticketWaveId
  z.record(z.string(), z.number().min(0).max(10)), // priceGroupPrice -> amount
);

export type TicketSelectionFormValues = z.infer<typeof TicketSelectionSchema>;

export const EventRightSide = (props: EventRightSideProps) => {
  const {ticketWaves} = props;

  const form = useForm<TicketSelectionFormValues>({
    resolver: zodResolver(TicketSelectionSchema),
    defaultValues: {},
  });

  // Filter ticket waves that have available tickets
  const availableTicketWaves = ticketWaves.filter(ticketWave =>
    ticketWave.priceGroups.some(group => Number(group.availableTickets) > 0),
  );

  const ticketSelection = form.watch();

  // Calculate total selected tickets across all waves and price groups
  const totalSelectedTickets = Object.values(ticketSelection).reduce(
    (waveTotal, priceGroups) => {
      return (
        waveTotal +
        Object.values(priceGroups).reduce(
          (groupTotal, count) => groupTotal + count,
          0,
        )
      );
    },
    0,
  );

  const updateTicketCount = (
    ticketWaveId: string,
    priceGroupPrice: string,
    availableTickets: number,
    delta: number,
  ) => {
    const currentWaveData = ticketSelection[ticketWaveId] || {};
    const currentCount = currentWaveData[priceGroupPrice] || 0;
    const newCount = Math.max(
      0,
      Math.min(availableTickets, currentCount + delta),
    );

    if (totalSelectedTickets - currentCount + newCount > 10) {
      toast.warning('Límite de entradas alcanzado', {
        description: 'Puedes seleccionar un máximo de 10 entradas por compra.',
        duration: 3000,
      });
      return; // Don't allow more than 10 tickets total
    }

    // Update the nested structure
    form.setValue(ticketWaveId, {
      ...currentWaveData,
      [priceGroupPrice]: newCount,
    });
  };

  const onSubmit: SubmitHandler<TicketSelectionFormValues> = async data => {
    // TODO: Implement purchase logic
    console.log('Purchase tickets:', data);
  };

  if (availableTicketWaves.length === 0) {
    return (
      <div className='flex flex-col gap-6'>
        <div className='text-center text-muted-foreground'>
          No hay entradas disponibles
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex flex-col gap-6'
      >
        <div className='flex flex-col gap-4'>
          <h3 className='font-medium text-lg'>Entradas disponibles</h3>
          <Accordion
            type='single'
            className='bg-background w-full px-6 py-1.5 rounded-md flex flex-col'
            defaultValue='ticket-wave-1'
          >
            {availableTicketWaves.map((ticketWave, index) => (
              <TicketWaveForm
                key={ticketWave.id}
                ticketWave={ticketWave}
                index={index}
                updateTicketCount={updateTicketCount}
              />
            ))}
          </Accordion>
        </div>

        {totalSelectedTickets > 0 && (
          <div className='space-y-4'>
            {/* Summary Section */}
            <div className='rounded-lg border bg-muted/50 p-4 space-y-3'>
              <h4 className='font-semibold text-lg'>Resumen de compra</h4>
              <div className='space-y-2'>
                {Object.entries(ticketSelection).map(
                  ([ticketWaveId, priceGroups]) => {
                    const ticketWave = ticketWaves.find(
                      wave => wave.id === ticketWaveId,
                    );
                    if (!ticketWave) return null;

                    return Object.entries(priceGroups).map(
                      ([price, quantity]) => {
                        if (quantity === 0) return null;

                        const unitPrice = parseFloat(price);
                        const totalPrice = unitPrice * quantity;

                        return (
                          <div
                            key={`${ticketWaveId}-${price}`}
                            className='flex justify-between items-center text-sm'
                          >
                            <div className='flex flex-col'>
                              <span className='font-medium'>
                                {ticketWave.name}
                              </span>
                              <span className='text-muted-foreground'>
                                {quantity} ×{' '}
                                {formatPrice(unitPrice, ticketWave.currency)}
                              </span>
                            </div>
                            <span className='font-semibold'>
                              {formatPrice(totalPrice, ticketWave.currency)}
                            </span>
                          </div>
                        );
                      },
                    );
                  },
                )}
              </div>
              <div className='border-t pt-3 space-y-2'>
                {(() => {
                  const subtotalAmount = Object.entries(ticketSelection).reduce(
                    (total, [ticketWaveId, priceGroups]) => {
                      const ticketWave = ticketWaves.find(
                        wave => wave.id === ticketWaveId,
                      );
                      if (!ticketWave) return total;

                      return (
                        total +
                        Object.entries(priceGroups).reduce(
                          (waveTotal, [price, quantity]) => {
                            return waveTotal + parseFloat(price) * quantity;
                          },
                          0,
                        )
                      );
                    },
                    0,
                  );

                  // Use the currency from the first ticket wave (assuming all waves have same currency)
                  const firstWave = ticketWaves.find(
                    wave =>
                      ticketSelection[wave.id] &&
                      Object.values(ticketSelection[wave.id] || {}).some(
                        qty => qty > 0,
                      ),
                  );
                  const currency = firstWave?.currency;

                  if (!currency) return null;

                  const commissionBreakdown =
                    calculateOrderFees(subtotalAmount);

                  return (
                    <>
                      <div className='flex justify-between items-center text-sm'>
                        <span>Subtotal:</span>
                        <span>{formatPrice(subtotalAmount, currency)}</span>
                      </div>
                      <div className='flex justify-between items-center text-sm text-muted-foreground'>
                        <span>Comisión de plataforma (6%):</span>
                        <span>
                          {formatPrice(
                            commissionBreakdown.platformCommission,
                            currency,
                          )}
                        </span>
                      </div>
                      <div className='flex justify-between items-center text-sm text-muted-foreground'>
                        <span>IVA sobre comisión (22%):</span>
                        <span>
                          {formatPrice(
                            commissionBreakdown.vatOnCommission,
                            currency,
                          )}
                        </span>
                      </div>
                      <div className='flex justify-between items-center font-bold text-lg border-t pt-2'>
                        <span>Total a pagar:</span>
                        <span>
                          {formatPrice(
                            commissionBreakdown.totalAmount,
                            currency,
                          )}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Purchase Button */}
            <div className='flex justify-end'>
              <Button type='submit' className='bg-primary-gradient h-12 w-40'>
                Comprar ({totalSelectedTickets})
              </Button>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
};

const TicketWaveForm = (props: {
  ticketWave: GetEventByIdResponse['ticketWaves'][number];
  index: number;
  updateTicketCount: (
    ticketWaveId: string,
    priceGroupPrice: string,
    availableTickets: number,
    delta: number,
  ) => void;
}) => {
  const {ticketWave, index, updateTicketCount} = props;
  const form = useFormContext<TicketSelectionFormValues>();

  // Filter price groups that have available tickets
  const availablePriceGroups = ticketWave.priceGroups.filter(
    group => Number(group.availableTickets) > 0,
  );

  if (availablePriceGroups.length === 0) {
    return null;
  }

  return (
    <AccordionItem value={`ticket-wave-${index + 1}`}>
      <AccordionTrigger>
        <div className='flex flex-col gap-2'>
          <h3 className='font-medium'>{ticketWave.name}</h3>
          <p className='font-sm text-foreground/25'>{ticketWave.description}</p>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className='space-y-4 py-4'>
          {availablePriceGroups.map(priceGroup => {
            const priceGroupPrice = priceGroup.price;
            const availableTickets = Number(priceGroup.availableTickets);
            const selectedCount =
              form.watch(`${ticketWave.id}.${priceGroupPrice}`) || 0;

            return (
              <div
                key={`${ticketWave.id}-${priceGroupPrice}`}
                className='flex items-center justify-between p-4 border rounded-lg'
              >
                <div className='flex flex-col gap-1'>
                  <span className='font-medium'>
                    {formatPrice(
                      parseFloat(priceGroup.price),
                      ticketWave.currency,
                    )}
                  </span>
                  <span className='text-sm text-muted-foreground'>
                    {availableTickets} disponibles
                  </span>
                </div>

                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
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
                    className='h-8 w-8 p-0'
                  >
                    <MinusIcon className='h-4 w-4' />
                  </Button>

                  <Input
                    value={selectedCount}
                    readOnly
                    className='w-16 text-center h-8'
                  />

                  <Button
                    variant='outline'
                    size='sm'
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
                    className='h-8 w-8 p-0'
                  >
                    <PlusIcon className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
