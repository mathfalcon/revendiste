import {z} from 'zod';
import type {GetEventByIdResponse} from '~/lib';

// Schema for ticket selection form
export const TicketSelectionSchema = z.record(
  z.string(), // ticketWaveId
  z.record(z.string(), z.number().min(0).max(10)), // priceGroupPrice -> amount
);

export type TicketSelectionFormValues = z.infer<typeof TicketSelectionSchema>;

export type TicketWave = GetEventByIdResponse['ticketWaves'][number];

export type PriceGroup = TicketWave['priceGroups'][number];

// LocalStorage key for persisting form data
export const FORM_DATA_STORAGE_KEY = 'pending-order-form-data';
