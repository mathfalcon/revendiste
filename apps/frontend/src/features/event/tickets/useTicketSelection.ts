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
} from './types';

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
      const validatedData: TicketSelectionFormValues = {};
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
          // Check if this price still exists in the ticket wave's price groups
          const priceGroupExists = ticketWave.priceGroups.some(
            pg => pg.price === price && Number(pg.availableTickets) > 0,
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

      // If there were invalid selections, reset the form with only valid data
      if (hasInvalidSelections) {
        form.reset(validatedData);
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

    createOrderMutation.mutate({
      eventId: eventId,
      ticketSelections: data,
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

  return {
    form,
    ticketSelection,
    totalSelectedTickets,
    updateTicketCount,
    onSubmit,
    calculateTotals,
    isLoaded,
    isPending: createOrderMutation.isPending,
  };
}
