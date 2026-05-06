import express from 'express';
import {
  Route,
  Get,
  Post,
  Tags,
  Middlewares,
  Response,
  Request,
  Queries,
} from '@mathfalcon/tsoa-runtime';
import {
  requireAuthMiddleware,
  requireAdminMiddleware,
  ensurePagination,
  paginationMiddleware,
} from '~/middleware';
import {NotFoundError, UnauthorizedError, ValidationError} from '~/errors';
import {ValidateBody, ValidateQuery, Body} from '~/decorators';
import {db} from '~/db';
import {
  ImpersonationLogsRepository,
  UsersRepository,
} from '~/repositories';
import {AdminUsersService} from '~/services/admin-users';
import {AdminImpersonationService} from '~/services/admin-impersonation';
import {
  AdminUsersListRouteSchema,
  type AdminUsersListQuery,
  CreateImpersonationRouteBody,
  CreateImpersonationRouteSchema,
} from './validation';

type ListUsersResponse = Awaited<
  ReturnType<AdminUsersService['listUsers']>
>;

type CreateActorTokenResponse = Awaited<
  ReturnType<AdminImpersonationService['createActorToken']>
>;

function getClientIp(request: express.Request): string {
  const xff = request.headers['x-forwarded-for'];
  const fromXff =
    typeof xff === 'string'
      ? xff.split(',')[0]?.trim()
      : Array.isArray(xff)
        ? xff[0]?.trim()
        : undefined;
  return fromXff || request.ip || request.socket.remoteAddress || 'unknown';
}

@Route('admin/users')
@Middlewares(requireAuthMiddleware, requireAdminMiddleware)
@Tags('Admin - Users')
export class AdminUsersController {
  private service = new AdminUsersService(new UsersRepository(db));
  private impersonationService = new AdminImpersonationService(
    new UsersRepository(db),
    new ImpersonationLogsRepository(db),
  );

  @Get('/')
  @ValidateQuery(AdminUsersListRouteSchema)
  @Middlewares(paginationMiddleware(20, 100), ensurePagination)
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async listUsers(
    @Queries() query: AdminUsersListQuery,
    @Request() request: express.Request,
  ): Promise<ListUsersResponse> {
    return this.service.listUsers(request.pagination!, {
      search: query.search,
    });
  }

  @Post('/impersonation/actor-token')
  @ValidateBody(CreateImpersonationRouteSchema)
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<ValidationError>(422, 'Validation failed')
  @Response<NotFoundError>(404, 'Not found')
  public async createActorToken(
    @Body() body: CreateImpersonationRouteBody,
    @Request() request: express.Request,
  ): Promise<CreateActorTokenResponse> {
    return this.impersonationService.createActorToken({
      adminUser: request.user,
      targetUserId: body.targetUserId,
      reason: body.reason,
      ipAddress: getClientIp(request),
    });
  }
}
