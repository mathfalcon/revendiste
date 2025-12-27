import {z} from 'zod';
import {PaginationSchema} from '~/middleware';

export const AdminPayoutsQuerySchema = PaginationSchema.extend({
  status: z
    .enum(['pending', 'completed', 'failed', 'cancelled'])
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
      voucherUrl: z.string().url().optional(),
    })
    .default({}), // Default to empty object if body is missing
});

export type ProcessPayoutRouteBody = z.infer<
  typeof ProcessPayoutRouteSchema
>['body'];

export const CompletePayoutRouteSchema = z.object({
  body: z.object({
    transactionReference: z.string().optional(),
    voucherUrl: z.string().url().optional(),
  }),
});

export type CompletePayoutRouteBody = z.infer<
  typeof CompletePayoutRouteSchema
>['body'];

export const FailPayoutRouteSchema = z.object({
  body: z.object({
    failureReason: z
      .string()
      .min(1, 'Debe proporcionar una razón para el fallo'),
  }),
});

export type FailPayoutRouteBody = z.infer<typeof FailPayoutRouteSchema>['body'];

export const UpdatePayoutRouteSchema = z.object({
  body: z.object({
    status: z
      .enum(['pending', 'completed', 'failed', 'cancelled'])
      .optional(),
    processingFee: z.number().optional(),
    notes: z.string().optional(),
    voucherUrl: z.string().url().optional(),
    transactionReference: z.string().optional(),
  }),
});

export type UpdatePayoutRouteBody = z.infer<
  typeof UpdatePayoutRouteSchema
>['body'];

export const CancelPayoutRouteSchema = z.object({
  body: z.object({
    reasonType: z.enum(['error', 'other']),
    failureReason: z
      .string()
      .min(1, 'Debe proporcionar una razón para la cancelación'),
  }),
});

export type CancelPayoutRouteBody = z.infer<
  typeof CancelPayoutRouteSchema
>['body'];
