import {z} from 'zod';
import {PaginationSchema} from '~/middleware';
import {
  TicketReportCaseTypeSchema,
  TicketReportEntityTypeSchema,
  TicketReportStatusSchema,
} from '@revendiste/shared';
import {VALIDATION_MESSAGES} from '~/constants/error-messages';

// ── User schemas ──────────────────────────────────────────────────────────────

export const CreateTicketReportSchema = z.object({
  body: z.object({
    caseType: TicketReportCaseTypeSchema,
    entityType: TicketReportEntityTypeSchema,
    entityId: z.string().uuid(VALIDATION_MESSAGES.ENTITY_ID_INVALID),
    description: z.string().max(2000).optional(),
  }),
});
export type CreateTicketReportBody = z.infer<
  typeof CreateTicketReportSchema
>['body'];

export const AddUserActionSchema = z.object({
  body: z.object({
    actionType: z.enum(['comment', 'close'], {
      error: VALIDATION_MESSAGES.ACTION_INVALID,
    }),
    comment: z.string().max(2000).optional(),
  }),
});
export type AddUserActionBody = z.infer<typeof AddUserActionSchema>['body'];

// ── Admin schemas ─────────────────────────────────────────────────────────────

export const AddAdminActionSchema = z.object({
  body: z
    .object({
      actionType: z.enum(
        ['refund_partial', 'refund_full', 'reject', 'close', 'comment'],
        {error: VALIDATION_MESSAGES.ACTION_TYPE_INVALID},
      ),
      comment: z.string().max(2000).optional(),
      metadata: z
        .object({
          refundAmount: z.number().positive().optional(),
          refundReason: z.string().max(500).optional(),
          reservationIds: z.array(z.string().uuid()).optional(),
        })
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (data.actionType === 'refund_partial' && !data.metadata?.refundAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El monto del reembolso es requerido para reembolsos parciales',
          path: ['metadata', 'refundAmount'],
        });
      }
    }),
});
export type AddAdminActionBody = z.infer<typeof AddAdminActionSchema>['body'];

export const AdminListTicketReportsQuerySchema = PaginationSchema.extend({
  status: TicketReportStatusSchema.optional(),
  caseType: TicketReportCaseTypeSchema.optional(),
});
export const AdminListTicketReportsRouteSchema = z.object({
  query: AdminListTicketReportsQuerySchema,
});
export type AdminListTicketReportsQuery = z.infer<
  typeof AdminListTicketReportsQuerySchema
>;
