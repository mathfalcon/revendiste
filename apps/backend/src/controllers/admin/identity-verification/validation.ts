import {z} from 'zod';
import {PaginationSchema} from '~/middleware';
import {VALIDATION_MESSAGES} from '~/constants/error-messages';

// Query schema for listing verifications that need review
export const AdminVerificationsQuerySchema = PaginationSchema.extend({
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'verificationAttempts'])
    .optional()
    .default('updatedAt'),
  status: z
    .enum([
      'requires_manual_review',
      'pending',
      'failed',
      'completed',
      'rejected',
    ])
    .optional(),
});

export const AdminVerificationsRouteSchema = z.object({
  query: AdminVerificationsQuerySchema,
});

export type AdminVerificationsQuery = z.infer<
  typeof AdminVerificationsQuerySchema
>;

// Schema for approving a verification
export const ApproveVerificationRouteSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
  }),
});

export type ApproveVerificationRouteBody = z.infer<
  typeof ApproveVerificationRouteSchema
>['body'];

// Schema for rejecting a verification
export const RejectVerificationRouteSchema = z.object({
  body: z.object({
    reason: z.string().min(1, VALIDATION_MESSAGES.REJECTION_REASON_REQUIRED),
  }),
});

export type RejectVerificationRouteBody = z.infer<
  typeof RejectVerificationRouteSchema
>['body'];
