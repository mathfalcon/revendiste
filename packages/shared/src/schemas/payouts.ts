/**
 * Shared payout schemas
 *
 * These Zod schemas define the structure of payout metadata.
 * They are used by both backend and frontend for type safety.
 */

import {z} from 'zod';

/**
 * Currency conversion information schema
 * Used when payouts are converted from one currency to another (e.g., UYU to USD for PayPal)
 */
export const CurrencyConversionSchema = z.object({
  originalAmount: z.number(),
  originalCurrency: z.string(),
  exchangeRate: z.number(),
  convertedAt: z.string(), // ISO date string
});

export type CurrencyConversion = z.infer<typeof CurrencyConversionSchema>;

/**
 * Payout metadata schema
 * Stores information about the payout including selected tickets/listings,
 * currency conversion (if applicable), and voucher URL (if uploaded by admin)
 */
export const PayoutMetadataSchema = z.object({
  listingTicketIds: z.array(z.string()).default([]),
  listingIds: z.array(z.string()).default([]),
  currencyConversion: CurrencyConversionSchema.optional(),
  voucherUrl: z.string().url().optional(),
});

export type PayoutMetadata = z.infer<typeof PayoutMetadataSchema>;

