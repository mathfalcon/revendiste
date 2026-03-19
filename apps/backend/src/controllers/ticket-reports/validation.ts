import {z} from 'zod';
import {PaginationSchema} from '~/middleware';
import {
  TicketReportCaseTypeSchema,
  TicketReportEntityTypeSchema,
  TicketReportStatusSchema,
} from '@revendiste/shared';

// ── User schemas ──────────────────────────────────────────────────────────────

export const CreateTicketReportSchema = z.object({
  body: z.object({
    caseType: TicketReportCaseTypeSchema,
    entityType: TicketReportEntityTypeSchema,
    entityId: z.string().uuid('ID de entidad inválido'),
    description: z.string().max(2000).optional(),
  }),
});
export type CreateTicketReportBody = z.infer<
  typeof CreateTicketReportSchema
>['body'];

export const AddUserActionSchema = z.object({
  body: z.object({
    actionType: z.enum(['comment', 'close'], {
      error: 'Acción inválida',
    }),
    comment: z.string().max(2000).optional(),
  }),
});
export type AddUserActionBody = z.infer<typeof AddUserActionSchema>['body'];

// ── Admin schemas ─────────────────────────────────────────────────────────────

export const AddAdminActionSchema = z.object({
  body: z.object({
    actionType: z.enum(
      ['refund_partial', 'refund_full', 'reject', 'close', 'comment'],
      {error: 'Tipo de acción inválido'},
    ),
    comment: z.string().max(2000).optional(),
    metadata: z
      .object({
        refundAmount: z.number().positive().optional(),
        refundReason: z.string().optional(),
        reservationIds: z.array(z.string().uuid()).optional(),
      })
      .optional(),
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
