import {z} from 'zod';
import {PaginationSchema} from '~/middleware';

export const AdminUsersListQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
});

export const AdminUsersListRouteSchema = z.object({
  query: AdminUsersListQuerySchema,
});

export type AdminUsersListQuery = z.infer<typeof AdminUsersListQuerySchema>;

export const CreateImpersonationRouteSchema = z.object({
  body: z.object({
    targetUserId: z.string().uuid(),
    reason: z.string().max(2000).optional(),
  }),
});

export type CreateImpersonationRouteBody = z.infer<
  typeof CreateImpersonationRouteSchema
>['body'];
