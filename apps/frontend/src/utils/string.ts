import {format} from 'date-fns';
import {es} from 'date-fns/locale';
import {EventTicketCurrency} from '~/lib';
import type {EventTicketCurrency as EventTicketCurrencyType} from '@revendiste/shared';

export const getCurrencySymbol = (currency: EventTicketCurrency) => {
  switch (currency) {
    case EventTicketCurrency.USD:
      return 'U$S';
    case EventTicketCurrency.UYU:
      return '$';
  }
};

export const formatEventDate = (date: Date) => {
  // "23 de septiembre a las 18:30"
  return format(date, "d 'de' MMMM 'a las' HH:mm", {locale: es});
};

export const formatPrice = (
  price: number,
  currency: EventTicketCurrency = EventTicketCurrency.UYU,
) => {
  return `${getCurrencySymbol(currency)} ${Math.round(price).toLocaleString('es-ES')}`;
};

/**
 * Format currency amount with currency symbol and code
 * Shows decimal places (unlike formatPrice which rounds)
 */
export function formatCurrency(
  amount: string | number,
  currency: EventTicketCurrencyType,
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const formatted = new Intl.NumberFormat('es-UY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);

  if (currency === 'UYU') {
    return `$${formatted} UYU`;
  }
  return `$${formatted} USD`;
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
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal =
    local.length <= 2
      ? '*'.repeat(local.length)
      : local.slice(0, 2) + '*'.repeat(Math.max(0, local.length - 2));
  return `${maskedLocal}@${domain}`;
}

// Re-export fee calculation functions for backward compatibility
export {calculateSellerAmount} from './fees';
