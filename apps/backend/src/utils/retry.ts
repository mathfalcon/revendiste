export interface RetryOptions {
  maxAttempts?: number;
  /** Base delay in ms; exponential backoff: delay * 2^attemptIndex */
  baseDelayMs?: number;
  /** If provided, only retry when this returns true (e.g. skip retry for 4xx). */
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 1000;

/**
 * Retries an async function with exponential backoff.
 * Use for transient failures (5xx, network errors). Use shouldRetry to avoid retrying 4xx.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const shouldRetry = options.shouldRetry ?? (() => true);

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!shouldRetry(error) || attempt === maxAttempts - 1) break;
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}
