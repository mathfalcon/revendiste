import express from 'express';
import {
  Route,
  Get,
  Post,
  Tags,
  Middlewares,
  Request,
  Response,
  Path,
  Queries,
} from '@mathfalcon/tsoa-runtime';
import {
  requireAuthMiddleware,
  requireAdminMiddleware,
  ensurePagination,
  paginationMiddleware,
} from '~/middleware';
import {UsersRepository} from '~/repositories';
import {db} from '~/db';
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
} from '~/errors';
import {ValidateBody, ValidateQuery, Body} from '~/decorators';
import {
  AdminVerificationsRouteSchema,
  AdminVerificationsQuery,
  ApproveVerificationRouteBody,
  ApproveVerificationRouteSchema,
  RejectVerificationRouteBody,
  RejectVerificationRouteSchema,
} from './validation';
import {AdminIdentityVerificationService} from '~/services/admin-identity-verification';

type GetVerificationsResponse = ReturnType<
  AdminIdentityVerificationService['getVerificationsForReview']
>;
type GetVerificationDetailsResponse = ReturnType<
  AdminIdentityVerificationService['getVerificationDetails']
>;
type ApproveVerificationResponse = ReturnType<
  AdminIdentityVerificationService['approveVerification']
>;
type RejectVerificationResponse = ReturnType<
  AdminIdentityVerificationService['rejectVerification']
>;
type GetVerificationImageUrlResponse = ReturnType<
  AdminIdentityVerificationService['getVerificationImageUrl']
>;
type GetVerificationAuditHistoryResponse = ReturnType<
  AdminIdentityVerificationService['getVerificationAuditHistory']
>;

@Route('admin/identity-verification')
@Middlewares(requireAuthMiddleware, requireAdminMiddleware)
@Tags('Admin - Identity Verification')
export class AdminIdentityVerificationController {
  private service = new AdminIdentityVerificationService(
    new UsersRepository(db),
    db,
  );

  @Get('/')
  @ValidateQuery(AdminVerificationsRouteSchema)
  @Middlewares(paginationMiddleware(10, 100), ensurePagination)
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async getVerifications(
    @Queries() query: AdminVerificationsQuery,
    @Request() request: express.Request,
  ): Promise<GetVerificationsResponse> {
    return this.service.getVerificationsForReview(request.pagination!, {
      status: query.status,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Get('/{userId}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'User not found')
  public async getVerificationDetails(
    @Path() userId: string,
  ): Promise<GetVerificationDetailsResponse> {
    return this.service.getVerificationDetails(userId);
  }

  @Get('/{userId}/images/{imageType}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Image not found')
  public async getVerificationImage(
    @Path() userId: string,
    @Path() imageType: 'document' | 'reference' | 'audit',
    @Queries() query: {index?: string},
  ): Promise<GetVerificationImageUrlResponse> {
    const auditIndex = query.index ? parseInt(query.index, 10) : undefined;
    return this.service.getVerificationImageUrl(userId, imageType, auditIndex);
  }

  @Post('/{userId}/approve')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'User not found')
  @Response<ValidationError>(422, 'User is not pending manual review')
  @ValidateBody(ApproveVerificationRouteSchema)
  public async approveVerification(
    @Path() userId: string,
    @Body() body: ApproveVerificationRouteBody,
    @Request() request: express.Request,
  ): Promise<ApproveVerificationResponse> {
    return this.service.approveVerification(userId, request.user.id, body.notes);
  }

  @Post('/{userId}/reject')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'User not found')
  @Response<ValidationError>(422, 'User is not pending manual review')
  @ValidateBody(RejectVerificationRouteSchema)
  public async rejectVerification(
    @Path() userId: string,
    @Body() body: RejectVerificationRouteBody,
    @Request() request: express.Request,
  ): Promise<RejectVerificationResponse> {
    return this.service.rejectVerification(userId, request.user.id, body.reason);
  }

  @Get('/{userId}/audit-history')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'User not found')
  public async getVerificationAuditHistory(
    @Path() userId: string,
    @Queries() query: {limit?: string; offset?: string},
  ): Promise<GetVerificationAuditHistoryResponse> {
    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const offset = query.offset ? parseInt(query.offset, 10) : 0;
    return this.service.getVerificationAuditHistory(userId, limit, offset);
  }
}
