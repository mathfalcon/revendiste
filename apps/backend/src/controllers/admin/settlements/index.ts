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
import {ProcessorSettlementsRepository} from '~/repositories/processor-settlements';
import {PayoutsRepository} from '~/repositories/payouts';
import {db} from '~/db';
import {NotFoundError, ValidationError, UnauthorizedError} from '~/errors';
import {ValidateBody, ValidateQuery, Body, Query} from '~/decorators';
import {ProcessorSettlementsService} from '~/services/processor-settlements';
import {
  AdminSettlementsQuery,
  AdminSettlementsRouteSchema,
  CreateSettlementRouteBody,
  CreateSettlementRouteSchema,
  AddSettlementPaymentRouteBody,
  AddSettlementPaymentRouteSchema,
  LinkSettlementPaymentRouteBody,
  LinkSettlementPaymentRouteSchema,
  FailSettlementRouteBody,
  FailSettlementRouteSchema,
} from './validation';

type ListSettlementsResponse = Awaited<
  ReturnType<ProcessorSettlementsRepository['listSettlements']>
>;
type SettlementDetailsResponse = Awaited<
  ReturnType<ProcessorSettlementsRepository['getSettlementById']>
>;
type CreateSettlementResponse = Awaited<
  ReturnType<ProcessorSettlementsService['createSettlement']>
>;
type AddSettlementPaymentResponse = Awaited<
  ReturnType<ProcessorSettlementsService['addPaymentToSettlement']>
>;
type LinkSettlementPaymentResponse = Awaited<
  ReturnType<ProcessorSettlementsService['linkSettlementPaymentToPayout']>
>;
type CompleteSettlementResponse = Awaited<
  ReturnType<ProcessorSettlementsService['completeSettlement']>
>;
type FailSettlementResponse = Awaited<
  ReturnType<ProcessorSettlementsService['failSettlement']>
>;

@Route('admin/settlements')
@Middlewares(requireAuthMiddleware, requireAdminMiddleware)
@Tags('Admin - Settlements')
export class AdminSettlementsController {
  private service = new ProcessorSettlementsService(
    new ProcessorSettlementsRepository(db),
    new PayoutsRepository(db),
  );

  @Get('/')
  @ValidateQuery(AdminSettlementsRouteSchema)
  @Middlewares(paginationMiddleware(10, 100), ensurePagination)
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async listSettlements(
    @Queries() query: AdminSettlementsQuery,
    @Request() request: express.Request,
  ): Promise<{
    data: ListSettlementsResponse;
    pagination: typeof request.pagination;
  }> {
    const settlements = await this.service.listSettlementsWithPagination({
      page: request.pagination!.page,
      limit: request.pagination!.limit,
      status: query.status,
      paymentProvider: query.paymentProvider,
    });

    return {
      data: settlements,
      pagination: request.pagination,
    };
  }

  @Get('/{settlementId}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Settlement not found')
  public async getSettlementDetails(
    @Path() settlementId: string,
  ): Promise<SettlementDetailsResponse> {
    return this.service.getSettlementById(settlementId);
  }

  @Post('/')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<ValidationError>(422, 'Validation failed')
  @ValidateBody(CreateSettlementRouteSchema)
  public async createSettlement(
    @Body() body: CreateSettlementRouteBody,
  ): Promise<CreateSettlementResponse> {
    return this.service.createSettlement({
      paymentProvider: body.paymentProvider,
      externalSettlementId: body.externalSettlementId,
      settlementDate: new Date(body.settlementDate),
      totalAmount: body.totalAmount,
      currency: body.currency,
      metadata: body.metadata,
    });
  }

  @Post('/{settlementId}/payments')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Settlement not found')
  @Response<ValidationError>(422, 'Validation failed')
  @ValidateBody(AddSettlementPaymentRouteSchema)
  public async addSettlementPayment(
    @Path() settlementId: string,
    @Body() body: AddSettlementPaymentRouteBody,
  ): Promise<AddSettlementPaymentResponse> {
    return this.service.addPaymentToSettlement(settlementId, body);
  }

  @Post('/{settlementId}/payments/{paymentId}/link-payout')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Settlement or payout not found')
  @Response<ValidationError>(422, 'Validation failed')
  @ValidateBody(LinkSettlementPaymentRouteSchema)
  public async linkSettlementPaymentToPayout(
    @Path() settlementId: string,
    @Path() paymentId: string,
    @Body() body: LinkSettlementPaymentRouteBody,
  ): Promise<LinkSettlementPaymentResponse> {
    return this.service.linkSettlementPaymentToPayout(paymentId, body.payoutId);
  }

  @Post('/{settlementId}/complete')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Settlement not found')
  public async completeSettlement(
    @Path() settlementId: string,
  ): Promise<CompleteSettlementResponse> {
    return this.service.completeSettlement(settlementId);
  }

  @Post('/{settlementId}/fail')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Settlement not found')
  @ValidateBody(FailSettlementRouteSchema)
  public async failSettlement(
    @Path() settlementId: string,
    @Body() body: FailSettlementRouteBody,
  ): Promise<FailSettlementResponse> {
    return this.service.failSettlement(settlementId, body.reason);
  }
}
