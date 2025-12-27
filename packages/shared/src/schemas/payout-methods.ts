/**
 * Shared payout method schemas
 *
 * These Zod schemas define the structure of payout method metadata.
 * They are used by both backend and transactional packages for type safety.
 *
 * Structure:
 * - Country-level discriminated union (uruguayan_bank, argentinian_bank, etc.)
 * - Bank-level discriminated union within each country (different validations per bank)
 */

import {z} from 'zod';

/**
 * Uruguayan bank names enum
 */
export const UruguayanBankName = z.enum([
  'Itau',
  'OCA Blue',
  'PREX',
  'Banco Nacion Arg',
  'Bandes',
  'BBVA',
  'BHU',
  'BROU',
  'Citibank',
  'Dinero Electronico ANDA',
  'FUCAC',
  'FUCEREP',
  'GRIN',
  'Heritage',
  'HSBC',
  'Mercadopago',
  'Midinero',
  'Santander',
  'Scotiabank',
]);

export type UruguayanBankName = z.infer<typeof UruguayanBankName>;

/**
 * Individual bank metadata schemas for Uruguayan banks
 * Each bank can have different validation rules for account numbers
 */

// Itau - typically 7-10 digits
export const ItauBankMetadataSchema = z.object({
  bankName: z.literal('Itau'),
  accountNumber: z
    .string()
    .min(7, 'El número de cuenta debe tener al menos 7 dígitos')
    .max(10, 'El número de cuenta no puede tener más de 10 dígitos')
    .regex(/^\d+$/, 'El número de cuenta solo puede contener dígitos'),
});

// OCA Blue - typically 8-12 digits
export const OCABlueBankMetadataSchema = z.object({
  bankName: z.literal('OCA Blue'),
  accountNumber: z
    .string()
    .min(8, 'El número de cuenta debe tener al menos 8 dígitos')
    .max(12, 'El número de cuenta no puede tener más de 12 dígitos')
    .regex(/^\d+$/, 'El número de cuenta solo puede contener dígitos'),
});

// PREX - typically 8-10 digits
export const PREXBankMetadataSchema = z.object({
  bankName: z.literal('PREX'),
  accountNumber: z
    .string()
    .min(8, 'El número de cuenta debe tener al menos 8 dígitos')
    .max(10, 'El número de cuenta no puede tener más de 10 dígitos')
    .regex(/^\d+$/, 'El número de cuenta solo puede contener dígitos'),
});

// Banco Nacion Arg - typically 8-12 digits
export const BancoNacionArgBankMetadataSchema = z.object({
  bankName: z.literal('Banco Nacion Arg'),
  accountNumber: z
    .string()
    .min(8, 'El número de cuenta debe tener al menos 8 dígitos')
    .max(12, 'El número de cuenta no puede tener más de 12 dígitos')
    .regex(/^\d+$/, 'El número de cuenta solo puede contener dígitos'),
});

// Bandes - typically 7-10 digits
export const BandesBankMetadataSchema = z.object({
  bankName: z.literal('Bandes'),
  accountNumber: z
    .string()
    .min(7, 'El número de cuenta debe tener al menos 7 dígitos')
    .max(10, 'El número de cuenta no puede tener más de 10 dígitos')
    .regex(/^\d+$/, 'El número de cuenta solo puede contener dígitos'),
});

// BBVA - typically 7-10 digits
export const BBVABankMetadataSchema = z.object({
  bankName: z.literal('BBVA'),
  accountNumber: z
    .string()
    .min(7, 'El número de cuenta debe tener al menos 7 dígitos')
    .max(10, 'El número de cuenta no puede tener más de 10 dígitos')
    .regex(/^\d+$/, 'El número de cuenta solo puede contener dígitos'),
});

// BHU - typically 7-10 digits
export const BHUBankMetadataSchema = z.object({
  bankName: z.literal('BHU'),
  accountNumber: z
    .string()
    .min(7, 'El número de cuenta debe tener al menos 7 dígitos')
    .max(10, 'El número de cuenta no puede tener más de 10 dígitos')
    .regex(/^\d+$/, 'El número de cuenta solo puede contener dígitos'),
});

// BROU - typically 7-10 digits
export const BROUBankMetadataSchema = z.object({
  bankName: z.literal('BROU'),
  accountNumber: z
    .string()
    .min(7, 'El número de cuenta debe tener al menos 7 dígitos')
    .max(10, 'El número de cuenta no puede tener más de 10 dígitos')
    .regex(/^\d+$/, 'El número de cuenta solo puede contener dígitos'),
});

// Citibank - typically 7-10 digits
export const CitibankBankMetadataSchema = z.object({
  bankName: z.literal('Citibank'),
  accountNumber: z
    .string()
    .min(7, 'El número de cuenta debe tener al menos 7 dígitos')
    .max(10, 'El número de cuenta no puede tener más de 10 dígitos')
    .regex(/^\d+$/, 'El número de cuenta solo puede contener dígitos'),
});

// Dinero Electronico ANDA - typically 8-12 digits
export const DineroElectronicoANDABankMetadataSchema = z.object({
  bankName: z.literal('Dinero Electronico ANDA'),
  accountNumber: z
    .string()
    .min(8, 'El número de cuenta debe tener al menos 8 dígitos')
    .max(12, 'El número de cuenta no puede tener más de 12 dígitos')
    .regex(/^\d+$/, 'El número de cuenta solo puede contener dígitos'),
});

// FUCAC - typically 7-10 digits
export const FUCACBankMetadataSchema = z.object({
  bankName: z.literal('FUCAC'),
  accountNumber: z
    .string()
    .min(7, 'El número de cuenta debe tener al menos 7 dígitos')
    .max(10, 'El número de cuenta no puede tener más de 10 dígitos')
    .regex(/^\d+$/, 'El número de cuenta solo puede contener dígitos'),
});

// FUCEREP - typically 7-10 digits
export const FUCEREPBankMetadataSchema = z.object({
  bankName: z.literal('FUCEREP'),
  accountNumber: z
    .string()
    .min(7, 'El número de cuenta debe tener al menos 7 dígitos')
    .max(10, 'El número de cuenta no puede tener más de 10 dígitos')
    .regex(/^\d+$/, 'El número de cuenta solo puede contener dígitos'),
});

// GRIN - typically 8-12 digits
export const GRINBankMetadataSchema = z.object({
  bankName: z.literal('GRIN'),
  accountNumber: z
    .string()
    .min(8, 'El número de cuenta debe tener al menos 8 dígitos')
    .max(12, 'El número de cuenta no puede tener más de 12 dígitos')
    .regex(/^\d+$/, 'El número de cuenta solo puede contener dígitos'),
});

// Heritage - typically 7-10 digits
export const HeritageBankMetadataSchema = z.object({
  bankName: z.literal('Heritage'),
  accountNumber: z
    .string()
    .min(7, 'El número de cuenta debe tener al menos 7 dígitos')
    .max(10, 'El número de cuenta no puede tener más de 10 dígitos')
    .regex(/^\d+$/, 'El número de cuenta solo puede contener dígitos'),
});

// HSBC - typically 7-10 digits
export const HSBCBankMetadataSchema = z.object({
  bankName: z.literal('HSBC'),
  accountNumber: z
    .string()
    .min(7, 'El número de cuenta debe tener al menos 7 dígitos')
    .max(10, 'El número de cuenta no puede tener más de 10 dígitos')
    .regex(/^\d+$/, 'El número de cuenta solo puede contener dígitos'),
});

// Mercadopago - typically 8-12 digits
export const MercadopagoBankMetadataSchema = z.object({
  bankName: z.literal('Mercadopago'),
  accountNumber: z
    .string()
    .min(8, 'El número de cuenta debe tener al menos 8 dígitos')
    .max(12, 'El número de cuenta no puede tener más de 12 dígitos')
    .regex(/^\d+$/, 'El número de cuenta solo puede contener dígitos'),
});

// Midinero - typically 8-12 digits
export const MidineroBankMetadataSchema = z.object({
  bankName: z.literal('Midinero'),
  accountNumber: z
    .string()
    .min(8, 'El número de cuenta debe tener al menos 8 dígitos')
    .max(12, 'El número de cuenta no puede tener más de 12 dígitos')
    .regex(/^\d+$/, 'El número de cuenta solo puede contener dígitos'),
});

// Santander - typically 7-10 digits
export const SantanderBankMetadataSchema = z.object({
  bankName: z.literal('Santander'),
  accountNumber: z
    .string()
    .min(7, 'El número de cuenta debe tener al menos 7 dígitos')
    .max(10, 'El número de cuenta no puede tener más de 10 dígitos')
    .regex(/^\d+$/, 'El número de cuenta solo puede contener dígitos'),
});

// Scotiabank - typically 7-10 digits
export const ScotiabankBankMetadataSchema = z.object({
  bankName: z.literal('Scotiabank'),
  accountNumber: z
    .string()
    .min(7, 'El número de cuenta debe tener al menos 7 dígitos')
    .max(10, 'El número de cuenta no puede tener más de 10 dígitos')
    .regex(/^\d+$/, 'El número de cuenta solo puede contener dígitos'),
});

/**
 * Discriminated union of all Uruguayan bank metadata schemas
 * Uses 'bankName' as the discriminator field for type safety
 */
export const UruguayanBankMetadataSchema = z.discriminatedUnion('bankName', [
  ItauBankMetadataSchema,
  OCABlueBankMetadataSchema,
  PREXBankMetadataSchema,
  BancoNacionArgBankMetadataSchema,
  BandesBankMetadataSchema,
  BBVABankMetadataSchema,
  BHUBankMetadataSchema,
  BROUBankMetadataSchema,
  CitibankBankMetadataSchema,
  DineroElectronicoANDABankMetadataSchema,
  FUCACBankMetadataSchema,
  FUCEREPBankMetadataSchema,
  GRINBankMetadataSchema,
  HeritageBankMetadataSchema,
  HSBCBankMetadataSchema,
  MercadopagoBankMetadataSchema,
  MidineroBankMetadataSchema,
  SantanderBankMetadataSchema,
  ScotiabankBankMetadataSchema,
]);

/**
 * Uruguayan bank payout method schema
 * Includes the country type discriminator and bank-specific metadata
 */
export const UruguayanBankPayoutMethodSchema = z.object({
  type: z.literal('uruguayan_bank'),
  metadata: UruguayanBankMetadataSchema,
});

/**
 * PayPal metadata schema
 * PayPal requires the recipient's PayPal email address
 * PayPal only supports USD (not UYU natively)
 */
export const PayPalMetadataSchema = z.object({
  email: z.string().email('Debe ser un email válido de PayPal'),
});

/**
 * PayPal payout method schema
 * Includes the type discriminator for use in PayoutMethodMetadataSchema
 */
export const PayPalPayoutMethodSchema = z.object({
  type: z.literal('paypal'),
  metadata: PayPalMetadataSchema,
});

/**
 * Discriminated union of all payout method types by country
 * Uses 'type' as the discriminator field for type safety
 * Future: Add ArgentinianBankPayoutMethodSchema, WisePayoutMethodSchema, etc.
 */
export const PayoutMethodMetadataSchema = z.discriminatedUnion('type', [
  UruguayanBankPayoutMethodSchema,
  PayPalPayoutMethodSchema,
  // Future payout types can be added here:
  // ArgentinianBankPayoutMethodSchema,
  // WisePayoutMethodSchema,
]);

/**
 * TypeScript type inferred from the discriminated union schema
 */
export type PayoutMethodMetadata = z.infer<typeof PayoutMethodMetadataSchema>;

/**
 * Typed metadata based on payout type
 * Extracts the specific metadata type from the discriminated union
 */
export type TypedPayoutMethodMetadata<T extends PayoutMethodMetadata['type']> =
  Extract<PayoutMethodMetadata, {type: T}>;

/**
 * Uruguayan bank metadata type
 */
export type UruguayanBankMetadata = z.infer<typeof UruguayanBankMetadataSchema>;

/**
 * PayPal metadata type
 */
export type PayPalMetadata = z.infer<typeof PayPalMetadataSchema>;

/**
 * Helper to get all Uruguayan bank names as an array
 */
export const URUGUAYAN_BANKS: readonly UruguayanBankName[] = [
  'Itau',
  'OCA Blue',
  'PREX',
  'Banco Nacion Arg',
  'Bandes',
  'BBVA',
  'BHU',
  'BROU',
  'Citibank',
  'Dinero Electronico ANDA',
  'FUCAC',
  'FUCEREP',
  'GRIN',
  'Heritage',
  'HSBC',
  'Mercadopago',
  'Midinero',
  'Santander',
  'Scotiabank',
] as const;

/**
 * Uruguayan bank payout method schema (for API routes)
 * Uses 'payoutType' as discriminator (matching API route structure)
 * Can be extended with additional fields using .and()
 */
export const PayoutMethodUruguayanBankSchema = z.object({
  payoutType: z.literal('uruguayan_bank'),
  metadata: UruguayanBankMetadataSchema,
});

/**
 * PayPal payout method schema (for API routes)
 * Uses 'payoutType' as discriminator (matching API route structure)
 * Can be extended with additional fields using .and()
 */
export const PayoutMethodPayPalSchema = z.object({
  payoutType: z.literal('paypal'),
  metadata: PayPalMetadataSchema,
});

/**
 * Base schema for payout method route bodies
 * Uses 'payoutType' as discriminator (matching API route structure)
 * This discriminated union ensures type-safe metadata validation
 *
 * Both frontend and backend can extend these schemas with additional fields:
 * - Backend: .and(z.object({ accountHolderName, accountHolderSurname, currency, isDefault }))
 * - Frontend: .and(z.object({ accountHolderName, accountHolderSurname, currency, bankName, accountNumber, isDefault }))
 */
export const PayoutMethodBaseSchema = z.discriminatedUnion('payoutType', [
  PayoutMethodUruguayanBankSchema,
  PayoutMethodPayPalSchema,
]);
