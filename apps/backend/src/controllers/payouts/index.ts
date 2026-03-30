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
import {PayoutDocumentsService} from '~/services/payout-documents';
import {NotificationService} from '~/services/notifications';
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
  PayoutDocumentsRepository,
  UsersRepository,
  NotificationsRepository,
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
import {getPostHog} from '~/lib/posthog';

type GetBalanceResponse = ReturnType<SellerEarningsService['getSellerBalance']>;
type GetAvailableEarningsResponse = ReturnType<
  SellerEarningsService['getAvailableEarningsForSelection']
>;
type GetPayoutHistoryResponse = ReturnType<PayoutsService['getPayoutHistory']>;
type GetUserPayoutDetailsResponse = ReturnType<
  PayoutsService['getPayoutDetailsForUser']
>;
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

// Create shared repositories
const payoutsRepository = new PayoutsRepository(db);
const payoutDocumentsRepository = new PayoutDocumentsRepository(db);
const usersRepository = new UsersRepository(db);
const notificationsRepository = new NotificationsRepository(db);

// Create shared services
const notificationService = new NotificationService(
  notificationsRepository,
  usersRepository,
);

const payoutDocumentsService = new PayoutDocumentsService(
  payoutsRepository,
  payoutDocumentsRepository,
);

@Route('payouts')
@Middlewares(requireAuthMiddleware)
@Tags('Payouts')
export class PayoutsController {
  private sellerEarningsService = new SellerEarningsService(
    new SellerEarningsRepository(db),
    new OrderTicketReservationsRepository(db),
  );

  private payoutsService = new PayoutsService(
    payoutsRepository,
    new PayoutMethodsRepository(db),
    new SellerEarningsRepository(db),
    new PayoutEventsRepository(db),
    notificationService,
    payoutDocumentsService,
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
    const result = await this.payoutsService.requestPayout({
      sellerUserId: request.user.id,
      payoutMethodId: body.payoutMethodId,
      listingTicketIds: body.listingTicketIds,
      listingIds: body.listingIds,
    });
    getPostHog()?.capture({
      distinctId: request.user.id,
      event: 'payout_requested',
      properties: {
        payout_method_id: body.payoutMethodId,
        listing_ticket_count: body.listingTicketIds?.length ?? 0,
        listing_count: body.listingIds?.length ?? 0,
      },
    });
    return result;
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
    const result = await this.payoutMethodsService.addPayoutMethod({
      userId: request.user.id,
      ...body,
    });
    getPostHog()?.capture({
      distinctId: request.user.id,
      event: 'payout_method_added',
      properties: {
        payout_type: body.payoutType,
      },
    });
    return result;
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

  @Get('/{payoutId}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<NotFoundError>(404, 'Payout not found')
  public async getPayoutDetails(
    @Path() payoutId: string,
    @Request() request: express.Request,
  ): Promise<GetUserPayoutDetailsResponse> {
    return this.payoutsService.getPayoutDetailsForUser(
      payoutId,
      request.user.id,
    );
  }
}
