import type {GetPayoutMethodsResponse} from '~/lib';
import {UruguayanBankMetadataSchema} from '@revendiste/shared/schemas/payout-methods';
import {URUGUAYAN_BANK_INFO, type UruguayanBankName} from '@revendiste/shared';

/**
 * Safely extracts bank name from payout method metadata
 */
export function getBankName(
  metadata: GetPayoutMethodsResponse[number]['metadata'],
): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  const result = UruguayanBankMetadataSchema.safeParse(metadata);
  if (result.success) {
    return result.data.bankName;
  }

  if ('bankName' in metadata && typeof metadata.bankName === 'string') {
    return metadata.bankName;
  }

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

  const result = UruguayanBankMetadataSchema.safeParse(metadata);
  if (result.success) {
    return result.data.accountNumber;
  }

  if (
    'accountNumber' in metadata &&
    typeof metadata.accountNumber === 'string'
  ) {
    return metadata.accountNumber;
  }

  if (
    'account_number' in metadata &&
    typeof metadata.account_number === 'string'
  ) {
    return metadata.account_number;
  }

  return null;
}

/**
 * Gets the display name for a payout method (e.g., bank name)
 */
export function getPayoutMethodDisplayName(
  method: GetPayoutMethodsResponse[number],
): string {
  const bankName = getBankName(method.metadata);
  if (bankName && bankName in URUGUAYAN_BANK_INFO) {
    return URUGUAYAN_BANK_INFO[bankName as UruguayanBankName].displayName;
  }
  if (bankName) {
    return bankName;
  }

  return 'Banco';
}

/**
 * Gets the dropdown text for a payout method
 * Format: "Banco {bankName} - Cuenta {currency} {accountNumber} (Por defecto)"
 */
export function getPayoutMethodDropdownText(
  method: GetPayoutMethodsResponse[number],
): string {
  const bankName = getBankName(method.metadata);
  const accountNumber = getAccountNumber(method.metadata);

  if (bankName && accountNumber) {
    return `Banco ${bankName} - Cuenta ${method.currency} ${accountNumber}`;
  }

  if (bankName) {
    return `Banco ${bankName}`;
  }

  return 'Banco';
}
