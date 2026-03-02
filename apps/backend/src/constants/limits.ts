/**
 * Default batch/limit constants for cron jobs and sync operations.
 * Used to avoid magic numbers and allow tuning in one place.
 */
export const DEFAULT_CRON_BATCH_SIZE = 100;
export const PAYMENT_SYNC_BATCH_SIZE = 100;
export const SELLER_EARNINGS_HOLD_PERIOD_BATCH_SIZE = 100;
export const SELLER_EARNINGS_MISSING_DOCS_BATCH_SIZE = 100;
