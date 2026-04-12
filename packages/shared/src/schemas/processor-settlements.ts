/**
 * Processor settlement `metadata` (JSONB on `processor_settlements`).
 *
 * Used by backend when persisting and by admin UI when reading.
 * `.passthrough()` keeps extra keys from merges or future fields.
 */

import {z} from 'zod';

/** Snapshot stored at creation time (FIFO reconciliation vs declared total). */
export const ProcessorSettlementReconciliationSnapshotSchema = z.object({
  computedTotal: z.string(),
  declaredTotal: z.string(),
  differencePercent: z.number(),
  hadWarning: z.boolean(),
  paymentCount: z.number().int().nonnegative(),
});

export type ProcessorSettlementReconciliationSnapshot = z.infer<
  typeof ProcessorSettlementReconciliationSnapshotSchema
>;

export const ProcessorSettlementMetadataSchema = z
  .object({
    reconciliation: ProcessorSettlementReconciliationSnapshotSchema.optional(),
    failureReason: z.string().optional(),
  })
  .loose();

export type ProcessorSettlementMetadata = z.infer<
  typeof ProcessorSettlementMetadataSchema
>;

/**
 * Safe parse for DB/API values. Returns `null` if the value is not an object or
 * fails known-field checks (still use raw JSON for debugging when this is null).
 */
export function parseProcessorSettlementMetadata(
  value: unknown,
): ProcessorSettlementMetadata | null {
  if (value === null || value === undefined) {
    return null;
  }
  const result = ProcessorSettlementMetadataSchema.safeParse(value);
  return result.success ? result.data : null;
}
