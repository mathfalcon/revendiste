import express from 'express';
import {
  Route,
  Post,
  Get,
  Put,
  Delete,
  Tags,
  Middlewares,
  Request,
  Response,
  Path,
  Queries,
} from '@mathfalcon/tsoa-runtime';
import {SellerEarningsService} from '~/services/seller-earnings';
import {PayoutsService} from '~/services/payouts';
import {PayoutMethodsService} from '~/services/payout-methods';
import {
  requireAuthMiddleware,
  ensurePagination,
  paginationMiddleware,
  PaginationQuery,
} from '~/middleware';
import {
  SellerEarningsRepository,
  PayoutsRepository,
  PayoutMethodsRepository,
  PayoutEventsRepository,
  OrderTicketReservationsRepository,
  ListingTicketsRepository,
} from '~/repositories';
import {db} from '~/db';
import {NotFoundError, ValidationError, UnauthorizedError} from '~/errors';
import {
  RequestPayoutRouteBody,
  RequestPayoutRouteSchema,
  AddPayoutMethodRouteBody,
  AddPayoutMethodRouteSchema,
  UpdatePayoutMethodRouteBody,
  UpdatePayoutMethodRouteSchema,
} from './validation';
import {ValidateBody, Body} from '~/decorators';

type GetBalanceResponse = ReturnType<SellerEarningsService['getSellerBalance']>;
type GetAvailableEarningsResponse = ReturnType<
  SellerEarningsService['getAvailableEarningsForSelection']
>;
type GetPayoutHistoryResponse = ReturnType<PayoutsService['getPayoutHistory']>;
type RequestPayoutResponse = ReturnType<PayoutsService['requestPayout']>;
type GetPayoutMethodsResponse = ReturnType<
  PayoutMethodsService['getPayoutMethods']
>;
type AddPayoutMethodResponse = ReturnType<
  PayoutMethodsService['addPayoutMethod']
>;
type UpdatePayoutMethodResponse = ReturnType<
  PayoutMethodsService['updatePayoutMethod']
>;

@Route('payouts')
@Middlewares(requireAuthMiddleware)
@Tags('Payouts')
export class PayoutsController {
  private sellerEarningsService = new SellerEarningsService(
    new SellerEarningsRepository(db),
    new OrderTicketReservationsRepository(db),
    new ListingTicketsRepository(db),
  );

  private payoutsService = new PayoutsService(
    new PayoutsRepository(db),
    new PayoutMethodsRepository(db),
    new SellerEarningsRepository(db),
    new PayoutEventsRepository(db),
  );

  private payoutMethodsService = new PayoutMethodsService(
    new PayoutMethodsRepository(db),
  );

  @Get('/balance')
  @Response<UnauthorizedError>(401, 'Authentication required')
  public async getBalance(
    @Request() request: express.Request,
  ): Promise<GetBalanceResponse> {
    return this.sellerEarningsService.getSellerBalance(request.user.id);
  }

  @Get('/available-earnings')
  @Response<UnauthorizedError>(401, 'Authentication required')
  public async getAvailableEarnings(
    @Request() request: express.Request,
  ): Promise<GetAvailableEarningsResponse> {
    return this.sellerEarningsService.getAvailableEarningsForSelection(
      request.user.id,
    );
  }

  @Get('/history')
  @Middlewares(paginationMiddleware(10, 100), ensurePagination)
  @Response<UnauthorizedError>(401, 'Authentication required')
  public async getPayoutHistory(
    @Queries() query: PaginationQuery,
    @Request() request: express.Request,
  ): Promise<GetPayoutHistoryResponse> {
    return this.payoutsService.getPayoutHistory(
      request.user.id,
      request.pagination!,
    );
  }

  @Post('/request')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<ValidationError>(
    422,
    'Validation failed: Invalid selection, below minimum threshold, or mixed currencies',
  )
  @ValidateBody(RequestPayoutRouteSchema)
  public async requestPayout(
    @Body() body: RequestPayoutRouteBody,
    @Request() request: express.Request,
  ): Promise<RequestPayoutResponse> {
    return this.payoutsService.requestPayout({
      sellerUserId: request.user.id,
      payoutMethodId: body.payoutMethodId,
      listingTicketIds: body.listingTicketIds,
      listingIds: body.listingIds,
    });
  }

  @Get('/payout-methods')
  @Response<UnauthorizedError>(401, 'Authentication required')
  public async getPayoutMethods(
    @Request() request: express.Request,
  ): Promise<GetPayoutMethodsResponse> {
    return this.payoutMethodsService.getPayoutMethods(request.user.id);
  }

  @Post('/payout-methods')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<ValidationError>(
    422,
    'Validation failed: Invalid payout method data',
  )
  @ValidateBody(AddPayoutMethodRouteSchema)
  public async addPayoutMethod(
    @Body() body: AddPayoutMethodRouteBody,
    @Request() request: express.Request,
  ): Promise<AddPayoutMethodResponse> {
    return this.payoutMethodsService.addPayoutMethod({
      userId: request.user.id,
      ...body,
    });
  }

  @Put('/payout-methods/{payoutMethodId}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<NotFoundError>(404, 'Payout method not found')
  @Response<ValidationError>(
    422,
    'Validation failed: Invalid payout method data',
  )
  @ValidateBody(UpdatePayoutMethodRouteSchema)
  public async updatePayoutMethod(
    @Path() payoutMethodId: string,
    @Body() body: UpdatePayoutMethodRouteBody,
    @Request() request: express.Request,
  ): Promise<UpdatePayoutMethodResponse> {
    return this.payoutMethodsService.updatePayoutMethod(
      payoutMethodId,
      request.user.id,
      body,
    );
  }

  @Delete('/payout-methods/{payoutMethodId}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<NotFoundError>(404, 'Payout method not found')
  public async deletePayoutMethod(
    @Path() payoutMethodId: string,
    @Request() request: express.Request,
  ): Promise<void> {
    await this.payoutMethodsService.deletePayoutMethod(
      payoutMethodId,
      request.user.id,
    );
  }
}
