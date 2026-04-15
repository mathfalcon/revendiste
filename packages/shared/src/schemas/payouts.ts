/**
 * Shared payout schemas
 *
 * These Zod schemas define the structure of payout metadata.
 * They are used by both backend and frontend for type safety.
 */

import {z} from 'zod';

/** BROU eBROU-based rate lock at payout request time */
export const RateLockSchema = z.object({
  /** Effective UYU per 1 USD after spread (seller-facing lock) */
  lockedRate: z.number(),
  /**
   * Reference USD **venta** (UYU per 1 USD) at lock time — normally BROU eBROU;
   * may reflect Itaú cotiz.xml when BROU was unavailable.
   */
  brouVentaRate: z.number(),
  spreadPercent: z.number(),
  lockedAt: z.string(),
  rateExpiresAt: z.string(),
  originalAmount: z.number(),
  originalCurrency: z.string(),
  convertedAmount: z.number(),
  convertedCurrency: z.string(),
});

export type RateLock = z.infer<typeof RateLockSchema>;

/** Admin fills when processing (actual bank execution) */
export const FxProcessingSchema = z.object({
  actualBankRate: z.number().optional(),
  actualUyuCost: z.number().optional(),
  processedAt: z.string().optional(),
  rateWasExpired: z.boolean().optional(),
});

export type FxProcessing = z.infer<typeof FxProcessingSchema>;

export const PayoutMetadataSchema = z
  .object({
    listingTicketIds: z.array(z.string()).default([]),
    listingIds: z.array(z.string()).default([]),
    rateLock: RateLockSchema.optional(),
    fxProcessing: FxProcessingSchema.optional(),
  })
  .passthrough();

export type PayoutMetadata = z.infer<typeof PayoutMetadataSchema>;

/**
 * Safe parse for DB JSON that may include unknown keys or legacy shapes.
 */
export function parsePayoutMetadata(
  data: unknown,
): z.infer<typeof PayoutMetadataSchema> {
  return PayoutMetadataSchema.parse(data ?? {});
}
