/**
 * Typed log event names for PostHog / structured search.
 * Add new names here only — treat as a public API for dashboards and alerts.
 */
export type LogEvent =
  | 'payments.dlocal.create'
  | 'payments.dlocal.refund'
  | 'payments.dlocal.refund_lookup'
  | 'payments.dlocal.fetch'
  | 'payments.dlocal.force_expiration'
  | 'payments.link.created'
  | 'payments.sync'
  | 'webhooks.payment.processed'
  | 'webhooks.payment.signature'
  | 'webhooks.clerk.processed'
  | 'webhooks.clerk.signature'
  | 'orders.created'
  | 'orders.cancelled'
  | 'orders.expired'
  | 'cron.sync-payments-and-expire-orders'
  | 'cron.notify-upload-availability'
  | 'cron.check-payout-hold-periods'
  | 'cron.process-pending-notifications'
  | 'cron.process-pending-jobs'
  | 'cron.scrape-events'
  | 'notifications.sent';

export type LogOutcome =
  | 'success'
  | 'failure'
  | 'skipped'
  | 'duplicate'
  | 'timeout';

export type WideEventPayload = Record<string, unknown> & {outcome: LogOutcome};

/**
 * Builds metadata for `logger.info(message, wideEvent(...))`.
 * `event` is duplicated as a field so PostHog can filter on `attributes.event`.
 */
export function wideEvent<E extends LogEvent>(
  event: E,
  fields: WideEventPayload,
): WideEventPayload & {event: E} {
  return {event, ...fields};
}

export function withDuration(startMs: number): {durationMs: number} {
  return {durationMs: Date.now() - startMs};
}

const SENSITIVE_KEYS = new Set(
  [
    'authorization',
    'Authorization',
    'headers',
    'password',
    'secret',
    'token',
    'x-login',
    'x-trans-key',
    'x-signature',
    'apiKey',
    'api_key',
    'secretKey',
    'secret_key',
  ].map(k => k.toLowerCase()),
);

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase());
}

/**
 * Recursively redact known secret-bearing keys from objects (e.g. axios errors).
 * Does not deep-clone class instances; best-effort for logging only.
 */
export function redactKnownSecrets<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    } as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map(v => redactKnownSecrets(v)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (isSensitiveKey(k)) {
      out[k] = '[REDACTED]';
      continue;
    }
    if (v !== null && typeof v === 'object' && !(v instanceof Date)) {
      out[k] = redactKnownSecrets(v);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

/** Morgan / access logs: skip health probes so they never hit Winston or PostHog */
export function isHealthCheckPath(path: string): boolean {
  return (
    path === '/api/health' ||
    path.startsWith('/api/health/') ||
    path === '/health' ||
    path.startsWith('/health/') ||
    path === '/admin/dashboard/health'
  );
}
