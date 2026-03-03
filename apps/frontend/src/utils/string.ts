/**
 * String Utilities - Frontend
 *
 * Re-exports currency formatting from @revendiste/shared and provides
 * additional frontend-specific string utilities.
 */

import {format, isToday, isTomorrow} from 'date-fns';
import {es} from 'date-fns/locale';
import {EventTicketCurrency} from '~/lib';

// =============================================================================
// RE-EXPORT CURRENCY FORMATTING FROM SHARED
// =============================================================================
// All currency formatting should use these functions from the shared package
// to ensure consistency across the entire application.
export {
  formatPrice,
  formatCurrency,
  formatAmount,
  getCurrencySymbol,
} from '@revendiste/shared';

// =============================================================================
// DATE FORMATTING
// =============================================================================

export const formatEventDate = (date: Date) => {
  // "23 de septiembre a las 18:30"
  return format(date, "d 'de' MMMM 'a las' HH:mm", {locale: es});
};

const timeFormat = "HH:mm";

/**
 * Format event date in a relative, human-friendly way:
 * - Today → "Hoy a las 18:30"
 * - Tomorrow → "Mañana a las 09:00"
 * - Other days → "23 de septiembre a las 18:30"
 */
export function formatEventDateSmart(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const time = format(d, timeFormat, {locale: es});
  if (isToday(d)) return `Hoy a las ${time}`;
  if (isTomorrow(d)) return `Mañana a las ${time}`;
  return format(d, "d 'de' MMMM 'a las' HH:mm", {locale: es});
}

/**
 * Format date for display with time
 * Handles null/undefined values
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-UY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// =============================================================================
// MASKING UTILITIES
// =============================================================================

/**
 * Mask account number for display (show only last 4 digits)
 */
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber || accountNumber.length <= 4) {
    return accountNumber;
  }
  const last4 = accountNumber.slice(-4);
  const masked = '*'.repeat(Math.max(0, accountNumber.length - 4));
  return `${masked}${last4}`;
}

/**
 * Mask email address for display (show first 2 chars of local part, full domain)
 * Example: "john.doe@example.com" -> "jo******@example.com"
 */
export function maskEmail(email: string): string {
  if (!email) return email;
  const parts = email.split('@');
  const local = parts[0];
  const domain = parts[1];
  if (!local || !domain) return email;
  const maskedLocal =
    local.length <= 2
      ? '*'.repeat(local.length)
      : local.slice(0, 2) + '*'.repeat(Math.max(0, local.length - 2));
  return `${maskedLocal}@${domain}`;
}

// =============================================================================
// LEGACY EXPORTS (for backward compatibility)
// =============================================================================

// Re-export fee calculation functions for backward compatibility
export {calculateSellerAmount} from './fees';

// Legacy getCurrencySymbol that accepts EventTicketCurrency enum
// (the shared version accepts string, but this provides type safety for existing code)
import {getCurrencySymbol as sharedGetCurrencySymbol} from '@revendiste/shared';

export const getCurrencySymbolLegacy = (
  currency: EventTicketCurrency,
): string => {
  return sharedGetCurrencySymbol(currency);
};
