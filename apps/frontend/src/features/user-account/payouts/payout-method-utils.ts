import type {GetPayoutMethodsResponse} from '~/lib';
import {PayoutType} from '~/lib/api/generated';
import {
  UruguayanBankMetadataSchema,
  PayPalMetadataSchema,
} from '@revendiste/shared/schemas/payout-methods';

/**
 * Safely extracts bank name from payout method metadata
 */
export function getBankName(
  metadata: GetPayoutMethodsResponse[number]['metadata'],
): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  // Try to parse as Uruguayan bank metadata
  const result = UruguayanBankMetadataSchema.safeParse(metadata);
  if (result.success) {
    return result.data.bankName;
  }

  // Fallback: check if bankName (camelCase) exists directly
  if ('bankName' in metadata && typeof metadata.bankName === 'string') {
    return metadata.bankName;
  }

  // Fallback: check if bank_name (snake_case) exists directly (API might return this)
  if ('bank_name' in metadata && typeof metadata.bank_name === 'string') {
    return metadata.bank_name;
  }

  return null;
}

/**
 * Safely extracts account number from payout method metadata
 */
export function getAccountNumber(
  metadata: GetPayoutMethodsResponse[number]['metadata'],
): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  // Try to parse as Uruguayan bank metadata
  const result = UruguayanBankMetadataSchema.safeParse(metadata);
  if (result.success) {
    return result.data.accountNumber;
  }

  // Fallback: check if accountNumber (camelCase) exists directly
  if (
    'accountNumber' in metadata &&
    typeof metadata.accountNumber === 'string'
  ) {
    return metadata.accountNumber;
  }

  // Fallback: check if account_number (snake_case) exists directly (API might return this)
  if (
    'account_number' in metadata &&
    typeof metadata.account_number === 'string'
  ) {
    return metadata.account_number;
  }

  return null;
}

/**
 * Safely extracts email from payout method metadata
 */
export function getEmail(
  metadata: GetPayoutMethodsResponse[number]['metadata'],
): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  // Try to parse as PayPal metadata
  const result = PayPalMetadataSchema.safeParse(metadata);
  if (result.success) {
    return result.data.email;
  }

  // Fallback: check if email exists directly
  if ('email' in metadata && typeof metadata.email === 'string') {
    return metadata.email;
  }

  return null;
}

/**
 * Gets the display name for a payout method (e.g., "Itau", "PayPal")
 */
export function getPayoutMethodDisplayName(
  method: GetPayoutMethodsResponse[number],
): string {
  if (method.payoutType === PayoutType.Paypal) {
    return 'PayPal';
  }

  const bankName = getBankName(method.metadata);
  if (bankName) {
    return bankName;
  }

  // Fallback if metadata is missing
  return 'Banco';
}

/**
 * Gets the dropdown text for a payout method
 * Format: "Banco {bankName} - Cuenta {currency} {accountNumber} (Por defecto)"
 * or "PayPal - {email} (Por defecto)"
 */
export function getPayoutMethodDropdownText(
  method: GetPayoutMethodsResponse[number],
): string {
  if (method.payoutType === PayoutType.Paypal) {
    // For PayPal, show email if available
    const email = getEmail(method.metadata);
    if (email) {
      return `PayPal - ${email}`;
    }
    return 'PayPal';
  }

  // For Uruguayan banks, show "Banco {bankName} - Cuenta {currency} {accountNumber}"
  const bankName = getBankName(method.metadata);
  const accountNumber = getAccountNumber(method.metadata);

  if (bankName && accountNumber) {
    return `Banco ${bankName} - Cuenta ${method.currency} ${accountNumber}`;
  }

  if (bankName) {
    return `Banco ${bankName}`;
  }

  // Fallback if metadata is missing
  return 'Banco';
}

