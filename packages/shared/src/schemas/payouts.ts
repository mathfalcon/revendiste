/**
 * Shared payout schemas
 *
 * These Zod schemas define the structure of payout metadata.
 * They are used by both backend and frontend for type safety.
 */

import {z} from 'zod';

/** Event ticket / payout currencies we support in FX snapshots */
export const PayoutFxCurrencySchema = z.enum(['UYU', 'USD', 'ARS']);

export type PayoutFxCurrency = z.infer<typeof PayoutFxCurrencySchema>;

export const FxReferenceRateSchema = z.object({
  value: z.number(),
  source: z.enum(['brou_venta', 'dlocal_quote_reference', 'manual']),
  fetchedAt: z.string(),
});

export type FxReferenceRate = z.infer<typeof FxReferenceRateSchema>;

/**
 * FX state captured at payout request time (provider-agnostic).
 * Manual UY→USD: executor `admin_manual`, reference from BROU + spread as providerRate.
 * dLocal quote corridors: executor `dlocal_go`, quoteId + quoteExpiresAt set.
 */
export const FxSnapshotSchema = z.object({
  sourceCurrency: PayoutFxCurrencySchema,
  sourceAmount: z.number(),
  destinationCurrency: PayoutFxCurrencySchema,
  destinationAmount: z.number(),
  referenceRate: FxReferenceRateSchema.nullable().optional(),
  /** Effective rate used for the conversion (e.g. UYU per 1 USD after spread, or ARS per 1 USD from dLocal) */
  providerRate: z.number().optional(),
  spreadPercent: z.number().optional(),
  quoteId: z.string().optional(),
  quoteExpiresAt: z.string().optional(),
  executor: z.enum(['admin_manual', 'dlocal_go']),
});

export type FxSnapshot = z.infer<typeof FxSnapshotSchema>;

/** Admin or provider execution record at payout completion */
export const FxExecutionSchema = z.object({
  actualRate: z.number().optional(),
  /** Cost in source currency (e.g. UYU spent to obtain destination) */
  actualSourceAmount: z.number().optional(),
  providerFees: z.number().optional(),
  externalId: z.string().optional(),
  processedAt: z.string(),
  rateWasExpired: z.boolean().optional(),
});

export type FxExecution = z.infer<typeof FxExecutionSchema>;

export const PayoutMetadataSchema = z
  .object({
    listingTicketIds: z.array(z.string()).default([]),
    listingIds: z.array(z.string()).default([]),
    fxSnapshot: FxSnapshotSchema.optional(),
    fxExecution: FxExecutionSchema.optional(),
  })
  .passthrough();

export type PayoutMetadata = z.infer<typeof PayoutMetadataSchema>;

/**
 * Safe parse for DB JSON that may include unknown keys or legacy shapes.
 * Legacy keys (`rateLock`, `fxProcessing`, `dLocalArRateLock`) pass through via `.passthrough()`.
 */
export function parsePayoutMetadata(
  data: unknown,
): z.infer<typeof PayoutMetadataSchema> {
  return PayoutMetadataSchema.parse(data ?? {});
}
