import {z} from 'zod';
import {PaginationSchema} from '~/middleware';
import {VALIDATION_MESSAGES} from '~/constants/error-messages';

export const AdminPayoutsQuerySchema = PaginationSchema.extend({
  status: z
    .enum([
      'pending',
      'processing',
      'completed',
      'failed',
      'cancelled',
    ])
    .optional(),
});

export const AdminPayoutsRouteSchema = z.object({
  query: AdminPayoutsQuerySchema,
});

export type AdminPayoutsQuery = z.infer<typeof AdminPayoutsQuerySchema>;

export const ProcessPayoutRouteSchema = z.object({
  body: z
    .object({
      processingFee: z.number().optional(),
      transactionReference: z.string().optional(),
      notes: z.string().optional(),
      actualBankRate: z.number().positive().optional(),
      actualUyuCost: z.number().nonnegative().optional(),
    })
    .default({}), // Default to empty object if body is missing
});

export type ProcessPayoutRouteBody = z.infer<
  typeof ProcessPayoutRouteSchema
>['body'];

export const FailPayoutRouteSchema = z.object({
  body: z.object({
    failureReason: z
      .string()
      .min(1, VALIDATION_MESSAGES.FAILURE_REASON_REQUIRED),
  }),
});

export type FailPayoutRouteBody = z.infer<typeof FailPayoutRouteSchema>['body'];

export const CancelPayoutRouteSchema = z.object({
  body: z.object({
    reasonType: z.enum(['error', 'other']),
    failureReason: z
      .string()
      .min(1, VALIDATION_MESSAGES.CANCELLATION_REASON_REQUIRED),
  }),
});

export type CancelPayoutRouteBody = z.infer<
  typeof CancelPayoutRouteSchema
>['body'];

export const RefreshPayoutRateLockRouteSchema = z.object({
  body: z.object({}).default({}),
});

export type RefreshPayoutRateLockRouteBody = z.infer<
  typeof RefreshPayoutRateLockRouteSchema
>['body'];
