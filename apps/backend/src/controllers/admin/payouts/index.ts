import express from 'express';
import {
  Route,
  Get,
  Post,
  Put,
  Delete,
  Tags,
  Middlewares,
  Request,
  Response,
  Path,
  UploadedFile,
  Queries,
} from '@mathfalcon/tsoa-runtime';
import {PayoutsService} from '~/services/payouts';
import {PayoutDocumentsService} from '~/services/payout-documents';
import {NotificationService} from '~/services/notifications';
import {
  requireAuthMiddleware,
  requireAdminMiddleware,
  ensurePagination,
  paginationMiddleware,
} from '~/middleware';
import {
  PayoutsRepository,
  PayoutMethodsRepository,
  SellerEarningsRepository,
  PayoutEventsRepository,
  PayoutDocumentsRepository,
  UsersRepository,
  NotificationsRepository,
} from '~/repositories';
import {db} from '~/db';
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  BadRequestError,
} from '~/errors';
import {
  PAYOUT_ERROR_MESSAGES,
  PAYOUT_DOCUMENT_ERROR_MESSAGES,
  VALIDATION_MESSAGES,
} from '~/constants/error-messages';
import {ValidateBody, ValidateQuery, Body, Query} from '~/decorators';
import {
  ProcessPayoutRouteBody,
  ProcessPayoutRouteSchema,
  CompletePayoutRouteBody,
  CompletePayoutRouteSchema,
  FailPayoutRouteBody,
  FailPayoutRouteSchema,
  UpdatePayoutRouteBody,
  UpdatePayoutRouteSchema,
  CancelPayoutRouteBody,
  CancelPayoutRouteSchema,
  AdminPayoutsRouteSchema,
  AdminPayoutsQuery,
} from './validation';

type GetPayoutsResponse = Awaited<ReturnType<PayoutsService['getPayoutsForAdmin']>>;
type GetPayoutDetailsResponse = Awaited<ReturnType<
  PayoutsService['getPayoutDetailsForAdmin']
>>;
type ProcessPayoutResponse = Awaited<ReturnType<PayoutsService['processPayout']>>;
type CompletePayoutResponse = Awaited<ReturnType<PayoutsService['completePayout']>>;
type FailPayoutResponse = Awaited<ReturnType<PayoutsService['failPayout']>>;
type UpdatePayoutResponse = Awaited<ReturnType<PayoutsService['updatePayout']>>;
type CancelPayoutResponse = Awaited<ReturnType<PayoutsService['cancelPayout']>>;
type UploadPayoutDocumentResponse = Awaited<ReturnType<
  PayoutDocumentsService['uploadPayoutDocument']
>>;
type DeletePayoutDocumentResponse = Awaited<ReturnType<
  PayoutDocumentsService['deletePayoutDocument']
>>;

type TriggerHoldCheckResponse = {success: boolean; message: string};

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

@Route('admin/payouts')
@Middlewares(requireAuthMiddleware, requireAdminMiddleware)
@Tags('Admin - Payouts')
export class AdminPayoutsController {
  private payoutsService = new PayoutsService(
    payoutsRepository,
    new PayoutMethodsRepository(db),
    new SellerEarningsRepository(db),
    new PayoutEventsRepository(db),
    notificationService,
    payoutDocumentsService,
  );
  private payoutDocumentsService = payoutDocumentsService;

  @Get('/')
  @ValidateQuery(AdminPayoutsRouteSchema)
  @Middlewares(paginationMiddleware(10, 100), ensurePagination)
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async getPayouts(
    @Queries() query: AdminPayoutsQuery,
    @Request() request: express.Request,
  ): Promise<GetPayoutsResponse> {
    return this.payoutsService.getPayoutsForAdmin(request.pagination!, {
      status: query.status,
    });
  }

  @Get('/{payoutId}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Payout not found')
  public async getPayoutDetails(
    @Path() payoutId: string,
    @Request() request: express.Request,
  ): Promise<GetPayoutDetailsResponse> {
    return this.payoutsService.getPayoutDetailsForAdmin(
      payoutId,
      request.user.id,
    );
  }

  @Post('/{payoutId}/process')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Payout not found')
  @Response<ValidationError>(422, 'Invalid payout status or validation failed')
  @ValidateBody(ProcessPayoutRouteSchema)
  public async processPayout(
    @Path() payoutId: string,
    @Body() body: ProcessPayoutRouteBody,
    @Request() request: express.Request,
  ): Promise<ProcessPayoutResponse> {
    return this.payoutsService.processPayout(payoutId, request.user.id, body);
  }

  @Post('/{payoutId}/complete')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Payout not found')
  @Response<ValidationError>(422, 'Invalid payout status')
  @ValidateBody(CompletePayoutRouteSchema)
  public async completePayout(
    @Path() payoutId: string,
    @Body() body: CompletePayoutRouteBody,
    @Request() request: express.Request,
  ): Promise<CompletePayoutResponse> {
    return this.payoutsService.completePayout(payoutId, request.user.id, body);
  }

  @Post('/{payoutId}/fail')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Payout not found')
  @Response<ValidationError>(422, 'Validation failed')
  @ValidateBody(FailPayoutRouteSchema)
  public async failPayout(
    @Path() payoutId: string,
    @Body() body: FailPayoutRouteBody,
    @Request() request: express.Request,
  ): Promise<FailPayoutResponse> {
    return this.payoutsService.failPayout(
      payoutId,
      request.user.id,
      body.failureReason,
    );
  }

  @Put('/{payoutId}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Payout not found')
  @Response<ValidationError>(422, 'Validation failed')
  @ValidateBody(UpdatePayoutRouteSchema)
  public async updatePayout(
    @Path() payoutId: string,
    @Body() body: UpdatePayoutRouteBody,
    @Request() request: express.Request,
  ): Promise<UpdatePayoutResponse> {
    return this.payoutsService.updatePayout(payoutId, request.user.id, body);
  }

  @Post('/{payoutId}/cancel')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Payout not found')
  @Response<ValidationError>(422, 'Validation failed')
  @ValidateBody(CancelPayoutRouteSchema)
  public async cancelPayout(
    @Path() payoutId: string,
    @Body() body: CancelPayoutRouteBody,
    @Request() request: express.Request,
  ): Promise<CancelPayoutResponse> {
    return this.payoutsService.cancelPayout(
      payoutId,
      request.user.id,
      body.reasonType,
      body.failureReason,
    );
  }

  @Post('/{payoutId}/documents')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Payout not found')
  @Response<BadRequestError>(400, 'No file uploaded or invalid file')
  @Response<ValidationError>(422, 'Invalid file type or file too large')
  public async uploadPayoutDocument(
    @Path() payoutId: string,
    @UploadedFile('file') file: Express.Multer.File,
    @Request() request: express.Request,
  ): Promise<UploadPayoutDocumentResponse> {
    if (!file) {
      throw new BadRequestError(VALIDATION_MESSAGES.NO_FILE_UPLOADED);
    }

    return this.payoutDocumentsService.uploadPayoutDocument(
      payoutId,
      request.user.id,
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    );
  }

  @Delete('/documents/{documentId}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  @Response<NotFoundError>(404, 'Document not found')
  public async deletePayoutDocument(
    @Path() documentId: string,
    @Request() request: express.Request,
  ): Promise<DeletePayoutDocumentResponse> {
    return this.payoutDocumentsService.deletePayoutDocument(
      documentId,
      request.user.id,
    );
  }

  @Post('/trigger-hold-check')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async triggerHoldCheck(): Promise<TriggerHoldCheckResponse> {
    const {runCheckPayoutHoldPeriods} = await import(
      '~/cronjobs/check-payout-hold-periods'
    );
    await runCheckPayoutHoldPeriods();
    return {
      success: true,
      message: 'Hold period check triggered successfully',
    };
  }
}
