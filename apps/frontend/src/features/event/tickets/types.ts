import {z} from 'zod';
import type {GetEventByIdResponse} from '~/lib';
import type {EventTicketCurrency} from '~/lib/api/generated';

// Schema for ticket selection form
export const TicketSelectionSchema = z.record(
  z.string(), // ticketWaveId
  z.record(z.string(), z.number().min(0).max(10)), // priceGroupPrice -> amount
);

export type TicketSelectionFormValues = z.infer<typeof TicketSelectionSchema>;

export type TicketWave = GetEventByIdResponse['ticketWaves'][number];

export type PriceGroup = TicketWave['priceGroups'][number];

/** Currency of the current selection (first wave with tickets selected), or null if empty. */
export function getLockedCurrencyFromSelection(
  selection: TicketSelectionFormValues,
  ticketWaves: TicketWave[],
): EventTicketCurrency | null {
  for (const wave of ticketWaves) {
    const groups = selection[wave.id];
    if (!groups) continue;
    if (Object.values(groups).some(qty => qty > 0)) {
      return wave.currency;
    }
  }
  return null;
}

/** If selection spans more than one currency, drop waves that do not match the first (by `ticketWaves` order). */
export function trimSelectionToSingleCurrency(
  data: TicketSelectionFormValues,
  ticketWaves: TicketWave[],
): {data: TicketSelectionFormValues; wasTrimmed: boolean} {
  let keeper: EventTicketCurrency | null = null;
  let wasTrimmed = false;
  const next: TicketSelectionFormValues = {...data};

  for (const w of ticketWaves) {
    const g = next[w.id];
    if (!g || !Object.values(g).some(q => q > 0)) continue;
    if (keeper === null) {
      keeper = w.currency;
      continue;
    }
    if (w.currency !== keeper) {
      delete next[w.id];
      wasTrimmed = true;
    }
  }

  return {data: next, wasTrimmed};
}

// LocalStorage key for persisting form data
export const FORM_DATA_STORAGE_KEY = 'pending-order-form-data';
