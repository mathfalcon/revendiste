import {z} from 'zod';
import {
  UruguayanBankFormMetadataSchema,
  UruguayanBankMetadataSchema,
  UruguayanBankName,
} from '@revendiste/shared';

/**
 * Full payout-method form: holder + currency + draft metadata, then strict bank rules via superRefine.
 */
export const payoutMethodFormSchema = z
  .object({
    payoutType: z.literal('uruguayan_bank'),
    metadata: UruguayanBankFormMetadataSchema,
    accountHolderName: z.string().min(1, 'El nombre es requerido'),
    accountHolderSurname: z.string().min(1, 'El apellido es requerido'),
    currency: z.enum(['UYU', 'USD']),
    isDefault: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.metadata.bankName === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Seleccioná un banco',
        path: ['metadata', 'bankName'],
      });
      return;
    }
    const strict = UruguayanBankMetadataSchema.safeParse(val.metadata);
    if (!strict.success) {
      for (const issue of strict.error.issues) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: issue.message,
          path: ['metadata', ...issue.path],
        });
      }
    }
  });

export type PayoutMethodFormValues = z.infer<typeof payoutMethodFormSchema>;

export function parsePayoutMethodMetadataForApi(
  metadata: PayoutMethodFormValues['metadata'],
) {
  return UruguayanBankMetadataSchema.parse(metadata);
}

/** Narrow a string from API metadata to a bank enum value, or empty if unknown. */
export function parseBankNameForForm(
  bankName: string | null | undefined,
): z.infer<typeof UruguayanBankFormMetadataSchema>['bankName'] {
  const r = UruguayanBankName.safeParse(bankName);
  return r.success ? r.data : '';
}
