/**
 * Shared payout method schemas
 *
 * Each supported bank has its own Zod object (`BROUBankMetadataSchema`, `ItauBankMetadataSchema`, …)
 * with `bankName` as a literal discriminator; together they form `UruguayanBankMetadataSchema`
 * (discriminated union). Forms use `UruguayanBankFormMetadataSchema` until the user picks a bank.
 *
 * Account formats align with dLocal Go Uruguay payout documentation.
 */

import {z} from 'zod';

/**
 * Uruguayan bank names (subset supported by dLocal automated payouts + manual).
 */
export const UruguayanBankName = z.enum([
  'Banco Nacion Arg',
  'BBVA',
  'BHU',
  'BROU',
  'Citibank',
  'Heritage',
  'HSBC',
  'Itau',
  'Midinero',
  'OCA Blue',
  'PREX',
  'Santander',
  'Scotiabank',
]);

export type UruguayanBankName = z.infer<typeof UruguayanBankName>;

/**
 * Form draft: `bankName` may be empty until the user selects a bank.
 * On submit, narrow with {@link UruguayanBankMetadataSchema}.parse().
 */
export const UruguayanBankFormMetadataSchema = z.object({
  bankName: z.union([UruguayanBankName, z.literal('')]),
  accountNumber: z.string(),
});

export type UruguayanBankFormMetadata = z.infer<
  typeof UruguayanBankFormMetadataSchema
>;

/** BROU: 14 digits (9 account + 5 sub-account, numeric) */
export const BROUBankMetadataSchema = z.object({
  bankName: z.literal('BROU'),
  accountNumber: z
    .string()
    .length(14, 'El número de cuenta de BROU debe tener exactamente 14 dígitos')
    .regex(/^\d{14}$/, 'El número de cuenta solo puede contener dígitos'),
});

/** BHU: exactly 12 digits */
export const BHUBankMetadataSchema = z.object({
  bankName: z.literal('BHU'),
  accountNumber: z
    .string()
    .length(12, 'El número de cuenta de BHU debe tener exactamente 12 dígitos')
    .regex(/^\d{12}$/, 'El número de cuenta solo puede contener dígitos'),
});

/** Citibank: 10 digits, starts with 0, 1, or 5 */
export const CitibankBankMetadataSchema = z.object({
  bankName: z.literal('Citibank'),
  accountNumber: z
    .string()
    .length(
      10,
      'El número de cuenta de Citibank debe tener exactamente 10 dígitos',
    )
    .regex(
      /^[015]\d{9}$/,
      'El número de cuenta de Citibank debe tener 10 dígitos y comenzar con 0, 1 o 5',
    ),
});

/** Itau: exactly 7 digits (6 + verification digit) */
export const ItauBankMetadataSchema = z.object({
  bankName: z.literal('Itau'),
  accountNumber: z
    .string()
    .length(7, 'El número de cuenta de Itaú debe tener exactamente 7 dígitos')
    .regex(/^\d{7}$/, 'El número de cuenta solo puede contener dígitos'),
});

/** Scotiabank: exactly 10 digits */
export const ScotiabankBankMetadataSchema = z.object({
  bankName: z.literal('Scotiabank'),
  accountNumber: z
    .string()
    .length(
      10,
      'El número de cuenta de Scotiabank debe tener exactamente 10 dígitos',
    )
    .regex(/^\d{10}$/, 'El número de cuenta solo puede contener dígitos'),
});

/** Santander: exactly 12 digits */
export const SantanderBankMetadataSchema = z.object({
  bankName: z.literal('Santander'),
  accountNumber: z
    .string()
    .length(
      12,
      'El número de cuenta de Santander debe tener exactamente 12 dígitos',
    )
    .regex(/^\d{12}$/, 'El número de cuenta solo puede contener dígitos'),
});

/** Banco de la Nación Argentina: up to 12 digits */
export const BancoNacionArgBankMetadataSchema = z.object({
  bankName: z.literal('Banco Nacion Arg'),
  accountNumber: z
    .string()
    .min(1, 'El número de cuenta es requerido')
    .max(12, 'El número de cuenta no puede superar los 12 dígitos')
    .regex(/^\d{1,12}$/, 'El número de cuenta solo puede contener dígitos'),
});

/** BBVA: 1–9 digits, no leading zeros */
export const BBVABankMetadataSchema = z.object({
  bankName: z.literal('BBVA'),
  accountNumber: z
    .string()
    .min(1, 'El número de cuenta es requerido')
    .max(9, 'El número de cuenta de BBVA no puede superar los 9 dígitos')
    .regex(
      /^[1-9]\d{0,8}$/,
      'El número de cuenta de BBVA solo puede contener dígitos, sin ceros a la izquierda',
    ),
});

/** HSBC: 4–10 digits, no leading zeros */
export const HSBCBankMetadataSchema = z.object({
  bankName: z.literal('HSBC'),
  accountNumber: z
    .string()
    .min(4, 'El número de cuenta de HSBC debe tener al menos 4 dígitos')
    .max(10, 'El número de cuenta de HSBC no puede superar los 10 dígitos')
    .regex(
      /^[1-9]\d{3,9}$/,
      'El número de cuenta de HSBC solo puede contener dígitos, sin ceros a la izquierda',
    ),
});

/** Heritage: exactly 9 digits */
export const HeritageBankMetadataSchema = z.object({
  bankName: z.literal('Heritage'),
  accountNumber: z
    .string()
    .length(
      9,
      'El número de cuenta de Heritage debe tener exactamente 9 dígitos',
    )
    .regex(/^\d{9}$/, 'El número de cuenta solo puede contener dígitos'),
});

/** Prex: up to 8 digits, no leading zeros */
export const PREXBankMetadataSchema = z.object({
  bankName: z.literal('PREX'),
  accountNumber: z
    .string()
    .min(1, 'El número de cuenta es requerido')
    .max(8, 'El número de cuenta de Prex no puede superar los 8 dígitos')
    .regex(
      /^[1-9]\d{0,7}$/,
      'El número de cuenta de Prex solo puede contener dígitos, sin ceros a la izquierda',
    ),
});

/** Mi Dinero: 6–11 digits */
export const MidineroBankMetadataSchema = z.object({
  bankName: z.literal('Midinero'),
  accountNumber: z
    .string()
    .min(6, 'El número de cuenta de Mi Dinero debe tener al menos 6 dígitos')
    .max(11, 'El número de cuenta de Mi Dinero no puede superar los 11 dígitos')
    .regex(/^\d{6,11}$/, 'El número de cuenta solo puede contener dígitos'),
});

/** OCA Blue: exactly 7 digits */
export const OCABlueBankMetadataSchema = z.object({
  bankName: z.literal('OCA Blue'),
  accountNumber: z
    .string()
    .length(
      7,
      'El número de cuenta de OCA Blue debe tener exactamente 7 dígitos',
    )
    .regex(/^\d{7}$/, 'El número de cuenta solo puede contener dígitos'),
});

export const UruguayanBankMetadataSchema = z.discriminatedUnion('bankName', [
  BancoNacionArgBankMetadataSchema,
  BBVABankMetadataSchema,
  BHUBankMetadataSchema,
  BROUBankMetadataSchema,
  CitibankBankMetadataSchema,
  HeritageBankMetadataSchema,
  HSBCBankMetadataSchema,
  ItauBankMetadataSchema,
  MidineroBankMetadataSchema,
  OCABlueBankMetadataSchema,
  PREXBankMetadataSchema,
  SantanderBankMetadataSchema,
  ScotiabankBankMetadataSchema,
]);

const ArgentinianDocumentIdSchema = z
  .string()
  .min(7, 'Ingresá el documento con el formato requerido')
  .max(20);

export const ArgentinianBankCbuCvuMetadataSchema = z.object({
  routing: z.literal('cbu_cvu'),
  /** First 3 digits of CBU/CVU (BCRA bank code) */
  bankCode: z.string().length(3, 'Código de banco inválido'),
  accountNumber: z
    .string()
    .length(22, 'El CBU/CVU debe tener 22 dígitos')
    .regex(/^\d{22}$/, 'Solo se permiten dígitos en el CBU/CVU'),
  document: z.object({
    type: z.enum(['CUIT', 'CUIL', 'DNI']),
    id: ArgentinianDocumentIdSchema,
  }),
});

export const ArgentinianBankAliasMetadataSchema = z.object({
  routing: z.literal('alias'),
  /** dLocal: bank code 000 when paying by savings alias (CVU alias) */
  bankCode: z.literal('000'),
  alias: z
    .string()
    .min(6, 'Ingresá el alias bancario')
    .max(20, 'Alias bancario demasiado largo')
    .regex(
      /^[A-Za-z0-9.]+$/u,
      'Solo se permiten letras, números y un punto (sin @)',
    ),
  document: z.object({
    type: z.enum(['CUIT', 'CUIL', 'DNI']),
    id: ArgentinianDocumentIdSchema,
  }),
});

export const ArgentinianBankMetadataSchema = z.discriminatedUnion('routing', [
  ArgentinianBankCbuCvuMetadataSchema,
  ArgentinianBankAliasMetadataSchema,
]);

export type ArgentinianBankMetadata = z.infer<
  typeof ArgentinianBankMetadataSchema
>;

export const UruguayanBankPayoutMethodSchema = z.object({
  type: z.literal('uruguayan_bank'),
  metadata: UruguayanBankMetadataSchema,
});

export const ArgentinianBankPayoutMethodSchema = z.object({
  type: z.literal('argentinian_bank'),
  metadata: ArgentinianBankMetadataSchema,
});

export const PayoutMethodMetadataSchema = z.discriminatedUnion('type', [
  UruguayanBankPayoutMethodSchema,
  ArgentinianBankPayoutMethodSchema,
]);

export type PayoutMethodMetadata = z.infer<typeof PayoutMethodMetadataSchema>;

export type TypedPayoutMethodMetadata<T extends PayoutMethodMetadata['type']> =
  Extract<PayoutMethodMetadata, {type: T}>;

export type UruguayanBankMetadata = z.infer<typeof UruguayanBankMetadataSchema>;

export const URUGUAYAN_BANKS: readonly UruguayanBankName[] = [
  'Banco Nacion Arg',
  'BBVA',
  'BHU',
  'BROU',
  'Citibank',
  'Heritage',
  'HSBC',
  'Itau',
  'Midinero',
  'OCA Blue',
  'PREX',
  'Santander',
  'Scotiabank',
] as const;

export const PayoutMethodUruguayanBankSchema = z.object({
  payoutType: z.literal('uruguayan_bank'),
  metadata: UruguayanBankMetadataSchema,
});

export const PayoutMethodArgentinianBankSchema = z.object({
  payoutType: z.literal('argentinian_bank'),
  metadata: ArgentinianBankMetadataSchema,
});

/**
 * Add/update API body: discriminated by `payoutType`.
 * Internal typed metadata (`{ type, metadata }`) is defined by {@link PayoutMethodMetadataSchema}.
 */
export const PayoutMethodBaseSchema = z.discriminatedUnion('payoutType', [
  PayoutMethodUruguayanBankSchema,
  PayoutMethodArgentinianBankSchema,
]);
