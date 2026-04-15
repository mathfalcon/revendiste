import {useForm} from 'react-hook-form';
import {standardSchemaResolver} from '@hookform/resolvers/standard-schema';
import {toast} from 'sonner';
import {useUser} from '@clerk/tanstack-react-start';
import {useNavigate} from '@tanstack/react-router';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {postOrderMutation} from '~/lib/api/order';
import {useFormPersist} from '~/hooks';
import {redirectToLogin} from '~/utils';
import {getEventByIdQuery, PendingOrderErrorResponse} from '~/lib';
import {AxiosError} from 'axios';
import {
  TicketSelectionSchema,
  TicketSelectionFormValues,
  FORM_DATA_STORAGE_KEY,
  TicketWave,
  getLockedCurrencyFromSelection,
  trimSelectionToSingleCurrency,
} from './types';
import {usePostHog} from 'posthog-js/react';

interface UseTicketSelectionProps {
  eventId: string;
  ticketWaves: TicketWave[];
}

export function useTicketSelection({
  eventId,
  ticketWaves,
}: UseTicketSelectionProps) {
  const {isLoaded, isSignedIn} = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const posthog = usePostHog();

  const form = useForm<TicketSelectionFormValues>({
    resolver: standardSchemaResolver(TicketSelectionSchema),
    defaultValues: {},
  });

  // Persist form data to localStorage and restore on mount
  const {clear: clearPersistedData} = useFormPersist(FORM_DATA_STORAGE_KEY, {
    watch: form.watch,
    setValue: form.setValue,
    reset: form.reset,
    metadata: {eventId},
    onDataRestored: restoredData => {
      // Validate restored data against current ticket waves
      // Remove selections for ticket waves or price groups that no longer exist
      let validatedData: TicketSelectionFormValues = {};
      let hasInvalidSelections = false;

      for (const [ticketWaveId, priceGroups] of Object.entries(restoredData)) {
        const ticketWave = ticketWaves.find(tw => tw.id === ticketWaveId);
        if (!ticketWave) {
          // Ticket wave no longer exists
          hasInvalidSelections = true;
          continue;
        }

        // Check each price group within the ticket wave
        const validPriceGroups: Record<string, number> = {};
        for (const [price, quantity] of Object.entries(
          priceGroups as Record<string, number>,
        )) {
          const priceGroupExists = ticketWave.priceGroups.some(
            pg => String(pg.price) === price && Number(pg.availableTickets) > 0,
          );
          if (priceGroupExists && quantity > 0) {
            validPriceGroups[price] = quantity;
          } else if (quantity > 0) {
            hasInvalidSelections = true;
          }
        }

        if (Object.keys(validPriceGroups).length > 0) {
          validatedData[ticketWaveId] = validPriceGroups;
        }
      }

      const trimmed = trimSelectionToSingleCurrency(validatedData, ticketWaves);
      if (trimmed.wasTrimmed) {
        validatedData = trimmed.data;
      }

      const shouldResetForm = hasInvalidSelections || trimmed.wasTrimmed;
      if (shouldResetForm) {
        form.reset(validatedData);
      }

      if (hasInvalidSelections) {
        if (Object.keys(validatedData).length > 0) {
          toast.info('Algunas selecciones ya no están disponibles', {
            description: 'Hemos mantenido las que siguen disponibles.',
            duration: 4000,
          });
        } else {
          toast.warning('Tus selecciones ya no están disponibles', {
            description: 'Las entradas que habías seleccionado ya no existen.',
            duration: 4000,
          });
        }
      } else if (trimmed.wasTrimmed && Object.keys(validatedData).length > 0) {
        toast.info('Ajustamos tu selección', {
          description:
            'En una misma compra solo podés elegir entradas en una moneda. Dejamos las que coinciden.',
          duration: 5000,
        });
      } else if (Object.keys(validatedData).length > 0) {
        toast.info('Tus selecciones han sido restauradas', {
          description: 'Continúa con tu compra.',
          duration: 3000,
        });
      }
    },
    timeout: 1000 * 60 * 15, // 15 minutes
  });

  const createOrderMutation = useMutation({
    ...postOrderMutation({
      onOrderCreated: orderId => {
        form.reset();
        clearPersistedData();
        navigate({
          to: '/checkout/$orderId',
          params: {orderId},
        });
      },
      onPendingOrderFound: orderId => {
        navigate({
          to: '/checkout/$orderId',
          params: {orderId},
        });
      },
    }),
  });

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
      return;
    }

    if (delta > 0) {
      const wave = ticketWaves.find(w => w.id === ticketWaveId);
      if (wave) {
        const otherCurrency = ticketWaves
          .filter(tw => tw.id !== ticketWaveId)
          .find(tw => {
            const g = ticketSelection[tw.id];
            return g && Object.values(g).some(q => q > 0);
          })?.currency;
        if (otherCurrency !== undefined && otherCurrency !== wave.currency) {
          toast.warning('No podés combinar monedas en la misma compra', {
            description: `Ya seleccionaste entradas en ${otherCurrency}. Quitá esas cantidades para poder agregar entradas en ${wave.currency}.`,
            duration: 5000,
          });
          return;
        }
      }
    }

    // Set the whole wave object: price keys can contain '.' or ',' (e.g. 379.50),
    // so we must not use setValue(ticketWaveId + '.' + priceGroupPrice) as RHF
    // treats dots as path separators and would corrupt the form state.
    form.setValue(
      ticketWaveId,
      {
        ...currentWaveData,
        [priceGroupPrice]: newCount,
      },
      {shouldDirty: true, shouldValidate: true},
    );
  };

  const onSubmit = async (data: TicketSelectionFormValues) => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      redirectToLogin(navigate, {
        message: 'Por favor inicia sesión para continuar con tu compra',
      });
      return;
    }

    const {subtotalAmount, currency} = calculateTotals();
    posthog.capture('order_started', {
      event_id: eventId,
      ticket_count: totalSelectedTickets,
      subtotal_amount: subtotalAmount,
      currency,
    });

    const cleanedSelections: TicketSelectionFormValues = {};
    for (const [waveId, priceGroups] of Object.entries(data)) {
      const nonZero: Record<string, number> = {};
      for (const [price, qty] of Object.entries(priceGroups)) {
        if (qty > 0) nonZero[price] = qty;
      }
      if (Object.keys(nonZero).length > 0) {
        cleanedSelections[waveId] = nonZero;
      }
    }

    createOrderMutation.mutate({
      eventId: eventId,
      ticketSelections: cleanedSelections,
    });
  };

  // Calculate order totals
  const calculateTotals = () => {
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
  };

  const lockedCurrency = getLockedCurrencyFromSelection(
    ticketSelection,
    ticketWaves,
  );

  return {
    form,
    ticketSelection,
    totalSelectedTickets,
    lockedCurrency,
    updateTicketCount,
    onSubmit,
    calculateTotals,
    isLoaded,
    isPending: createOrderMutation.isPending,
  };
}
