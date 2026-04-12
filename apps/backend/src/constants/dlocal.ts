/**
 * DLocal Go HTTP client settings (no redirects for payment API safety).
 * API: https://docs.dlocalgo.com/integration-api/welcome-to-dlocal-go-api/payments/create-a-payment
 */
export const DLOCAL_REQUEST_TIMEOUT_MS = 30_000;
export const DLOCAL_MAX_REDIRECTS = 0;

/** Create payment: `description` must be at most 100 characters (dLocal Go API). */
export const DLOCAL_PAYMENT_DESCRIPTION_MAX_LENGTH = 100;
