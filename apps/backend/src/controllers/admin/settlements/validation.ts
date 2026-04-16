import {z} from 'zod';
import {PaginationSchema} from '~/middleware';
import {VALIDATION_MESSAGES} from '~/constants/error-messages';

const PaymentProviderEnum = z.enum(['dlocal', 'mercadopago', 'stripe']);

export const AdminSettlementsQuerySchema = PaginationSchema.extend({
  status: z.enum(['pending', 'completed', 'failed']).optional(),
  paymentProvider: PaymentProviderEnum.optional(),
});

export const AdminSettlementsRouteSchema = z.object({
  query: AdminSettlementsQuerySchema,
});

export type AdminSettlementsQuery = z.infer<typeof AdminSettlementsQuerySchema>;

// Create Settlement
export const CreateSettlementRouteSchema = z.object({
  body: z.object({
    paymentProvider: PaymentProviderEnum.optional(),
    externalSettlementId: z.string().min(1, VALIDATION_MESSAGES.ID_REQUIRED),
    settlementDate: z.string().datetime(),
    totalAmount: z.string().min(1),
    currency: z.enum(['UYU', 'USD']),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

export type CreateSettlementRouteBody = z.infer<
  typeof CreateSettlementRouteSchema
>['body'];

// Add Payment to Settlement
export const AddSettlementPaymentRouteSchema = z.object({
  body: z.object({
    operationId: z.string().min(1, VALIDATION_MESSAGES.ID_REQUIRED),
    amount: z.string().min(1),
    netAmount: z.string().min(1),
    exchangeRate: z.number().optional(),
    fees: z.string().optional(),
    currency: z.enum(['UYU', 'USD']),
    description: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

export type AddSettlementPaymentRouteBody = z.infer<
  typeof AddSettlementPaymentRouteSchema
>['body'];

// Link Payment to Payout
export const LinkSettlementPaymentRouteSchema = z.object({
  body: z.object({
    payoutId: z.string().min(1, VALIDATION_MESSAGES.ID_REQUIRED),
  }),
});

export type LinkSettlementPaymentRouteBody = z.infer<
  typeof LinkSettlementPaymentRouteSchema
>['body'];

// Complete Settlement
export const CompleteSettlementRouteSchema = z.object({
  body: z.object({}).optional(),
});

export type CompleteSettlementRouteBody = z.infer<
  typeof CompleteSettlementRouteSchema
>['body'];

// Fail Settlement
export const FailSettlementRouteSchema = z.object({
  body: z.object({
    reason: z.string().optional(),
  }),
});

export type FailSettlementRouteBody = z.infer<
  typeof FailSettlementRouteSchema
>['body'];
