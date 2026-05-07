/**
 * Reservation and payment window constants (in minutes).
 * Actual order expiration is also validated by the payment provider,
 * in cronjobs (sync-payments-and-expire-orders), and when the user reaches checkout.
 */
export const RESERVATION_WINDOW_MINUTES = 10;
export const PAYMENT_EXTENSION_WINDOW_MINUTES = 10;

/** Grace after payment window before pinging provider to force expiration webhook (dLocal). */
export const FORCE_EXPIRATION_GRACE_MINUTES = 5;
