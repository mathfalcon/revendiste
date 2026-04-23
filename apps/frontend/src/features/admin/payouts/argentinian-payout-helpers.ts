import {
  ArgentinianBankMetadataSchema,
  getArgentinianBankNameByCode,
} from '@revendiste/shared';

/**
 * Read-only view model for admin payout screens (AR bank: CBU/CVU vs alias).
 */
export function getArgentinianPayoutViewModel(rawMetadata: unknown) {
  const parsed = ArgentinianBankMetadataSchema.safeParse(rawMetadata);
  if (!parsed.success) {
    return null;
  }
  const m = parsed.data;
  const doc = `${m.document.type} ${m.document.id}`;
  if (m.routing === 'cbu_cvu') {
    return {
      doc,
      bank: getArgentinianBankNameByCode(m.bankCode),
      destination: m.accountNumber,
      destinationLabel: 'CBU / CVU' as const,
    };
  }
  return {
    doc,
    bank: getArgentinianBankNameByCode(m.bankCode),
    destination: m.alias,
    destinationLabel: 'Alias' as const,
  };
}
