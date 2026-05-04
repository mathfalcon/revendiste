import {z} from 'zod';
import type {
  ArgentinianBankMetadata,
  UruguayanBankMetadata,
} from '@revendiste/shared';
import {
  ArgentinianBankMetadataSchema,
  UruguayanBankFormMetadataSchema,
  UruguayanBankMetadataSchema,
  UruguayanBankName,
} from '@revendiste/shared';

const uruguayanPayoutMethodFormSchema = z
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

const argentinianFormMetadata = z
  .object({
    routing: z.enum(['cbu_cvu', 'alias']),
    bankCode: z
      .string()
      .min(1, 'Código de banco requerido')
      .max(3, 'Máximo 3 dígitos')
      .regex(/^\d{1,3}$/),
    accountOrAlias: z
      .string()
      .min(6, 'Dato bancario obligatorio')
      .max(22, 'Dato bancario demasiado largo'),
    documentType: z.enum(['CUIT', 'CUIL', 'DNI']),
    documentId: z
      .string()
      .min(7, 'Ingresá el documento con el formato requerido')
      .max(20, 'Máx. 20 caracteres'),
  })
  .superRefine((v, ctx) => {
    if (v.routing === 'cbu_cvu') {
      if (!/^\d{3}$/.test(v.bankCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Código de banco: 3 dígitos (BCRA)',
          path: ['bankCode'],
        });
      }
      if (!/^\d{22}$/.test(v.accountOrAlias)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El CBU/CVU son 22 dígitos',
          path: ['accountOrAlias'],
        });
      }
    } else {
      if (v.bankCode !== '000') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Para alias el código debe ser 000',
          path: ['bankCode'],
        });
      }
    }
  });

const argentinianPayoutMethodFormSchema = z
  .object({
    payoutType: z.literal('argentinian_bank'),
    metadata: argentinianFormMetadata,
    accountHolderName: z.string().min(1, 'El nombre es requerido'),
    accountHolderSurname: z.string().min(1, 'El apellido es requerido'),
    currency: z.enum(['ARS', 'USD']),
    isDefault: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    const meta = val.metadata;
    const forApi: Record<string, unknown> =
      meta.routing === 'cbu_cvu'
        ? {
            routing: 'cbu_cvu',
            bankCode: meta.bankCode,
            accountNumber: meta.accountOrAlias,
            document: {type: meta.documentType, id: meta.documentId},
          }
        : {
            routing: 'alias',
            bankCode: '000',
            alias: meta.accountOrAlias,
            document: {type: meta.documentType, id: meta.documentId},
          };
    const strict = ArgentinianBankMetadataSchema.safeParse(forApi);
    if (!strict.success) {
      for (const issue of strict.error.issues) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: issue.message,
          path: issue.path[0] === 'routing' ? [] : ['metadata', ...issue.path],
        });
      }
    }
  });

/**
 * Payout form: UY o AR según `payoutType` (distingue metadata).
 */
export const payoutMethodFormSchema = z.discriminatedUnion('payoutType', [
  uruguayanPayoutMethodFormSchema,
  argentinianPayoutMethodFormSchema,
]);

export type PayoutMethodFormValues = z.infer<typeof payoutMethodFormSchema>;

export function parsePayoutMethodMetadataForApi(
  data: Extract<PayoutMethodFormValues, {payoutType: 'uruguayan_bank'}>,
): UruguayanBankMetadata;
export function parsePayoutMethodMetadataForApi(
  data: Extract<PayoutMethodFormValues, {payoutType: 'argentinian_bank'}>,
): ArgentinianBankMetadata;
export function parsePayoutMethodMetadataForApi(
  data: PayoutMethodFormValues,
): UruguayanBankMetadata | ArgentinianBankMetadata {
  if (data.payoutType === 'uruguayan_bank') {
    return UruguayanBankMetadataSchema.parse(data.metadata);
  }
  const m = data.metadata;
  if (m.routing === 'cbu_cvu') {
    return ArgentinianBankMetadataSchema.parse({
      routing: 'cbu_cvu',
      bankCode: m.bankCode,
      accountNumber: m.accountOrAlias,
      document: {type: m.documentType, id: m.documentId},
    });
  }
  return ArgentinianBankMetadataSchema.parse({
    routing: 'alias',
    bankCode: '000',
    alias: m.accountOrAlias,
    document: {type: m.documentType, id: m.documentId},
  });
}

/** Narrow a string from API metadata to a bank enum value, or empty if unknown. */
export function parseBankNameForForm(
  bankName: string | null | undefined,
): z.infer<typeof UruguayanBankFormMetadataSchema>['bankName'] {
  const r = UruguayanBankName.safeParse(bankName);
  return r.success ? r.data : '';
}
