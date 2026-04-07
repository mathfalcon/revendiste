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
  Query,
  UploadedFile,
} from '@mathfalcon/tsoa-runtime';
import {TicketReportsService} from '~/services/ticket-reports';
import {TicketReportAttachmentsService} from '~/services/ticket-report-attachments';
import {NotificationService} from '~/services/notifications';
import {DLocalService} from '~/services/dlocal';
import {getStorageProvider} from '~/services/storage/StorageFactory';
import {
  requireAuthMiddleware,
  paginationMiddleware,
  ensurePagination,
} from '~/middleware';
import {
  TicketReportsRepository,
  TicketReportActionsRepository,
  TicketReportRefundsRepository,
  TicketReportAttachmentsRepository,
  OrderTicketReservationsRepository,
  OrdersRepository,
  PaymentsRepository,
  TicketDocumentsRepository,
  NotificationsRepository,
  UsersRepository,
  SellerEarningsRepository,
} from '~/repositories';
import {db} from '~/db';
import {NotFoundError, ValidationError, UnauthorizedError, BadRequestError, ConflictError} from '~/errors';
import {
  TICKET_REPORT_ERROR_MESSAGES,
  VALIDATION_MESSAGES,
} from '~/constants/error-messages';
import {ValidateBody, Body} from '~/decorators';
import {
  CreateTicketReportBody,
  CreateTicketReportSchema,
  AddUserActionBody,
  AddUserActionSchema,
} from './validation';

type UserCreateCaseResponse = ReturnType<TicketReportsService['createCase']>;
type UserListMyCasesResponse = ReturnType<
  TicketReportsService['listCasesForUser']
>;
type UserGetCaseDetailsResponse = ReturnType<
  TicketReportsService['getCaseDetails']
>;
type UserAddActionResponse = ReturnType<TicketReportsService['addAction']>;
type UserCloseCaseResponse = ReturnType<TicketReportsService['closeCase']>;
type CheckExistingReportResponse = ReturnType<
  TicketReportsService['checkExistingReport']
>;
type UploadAttachmentResponse = ReturnType<
  TicketReportAttachmentsService['uploadAttachment']
>;
type ListAttachmentsResponse = ReturnType<
  TicketReportAttachmentsService['getAttachmentsByReportId']
>;
type GetAttachmentUrlResponse = ReturnType<
  TicketReportAttachmentsService['getAttachmentUrl']
>;

const notificationsRepository = new NotificationsRepository(db);
const usersRepository = new UsersRepository(db);
const notificationService = new NotificationService(
  notificationsRepository,
  usersRepository,
);

@Route('ticket-reports')
@Middlewares(requireAuthMiddleware)
@Tags('Ticket Reports')
export class TicketReportsController {
  private reportsRepository = new TicketReportsRepository(db);

  private service = new TicketReportsService(
    this.reportsRepository,
    new TicketReportActionsRepository(db),
    new TicketReportRefundsRepository(db),
    new TicketReportAttachmentsRepository(db),
    new OrderTicketReservationsRepository(db),
    new OrdersRepository(db),
    new PaymentsRepository(db),
    new TicketDocumentsRepository(db),
    notificationService,
    new DLocalService(),
    getStorageProvider(),
    new SellerEarningsRepository(db),
  );

  private attachmentService = new TicketReportAttachmentsService(
    new TicketReportAttachmentsRepository(db),
    this.reportsRepository,
    getStorageProvider(),
  );

  @Post('/')
  @ValidateBody(CreateTicketReportSchema)
  @Response<ValidationError>(422, 'Validation error')
  @Response<ConflictError>(409, 'Ya existe un reporte abierto para esta entidad')
  public async createCase(
    @Body() body: CreateTicketReportBody,
    @Request() request: express.Request,
  ): Promise<UserCreateCaseResponse> {
    return this.service.createCase(body, request.user.id);
  }

  @Get('/')
  @Middlewares(paginationMiddleware(10, 50), ensurePagination)
  public async listMyCases(
    @Request() request: express.Request,
  ): Promise<UserListMyCasesResponse> {
    return this.service.listCasesForUser(request.user.id, request.pagination!);
  }

  @Get('/check-existing')
  public async checkExistingReport(
    @Query() entityType: string,
    @Query() entityId: string,
  ): Promise<CheckExistingReportResponse> {
    return this.service.checkExistingReport(entityType as any, entityId);
  }

  @Get('/{reportId}')
  @Response<NotFoundError>(404, 'Report not found')
  @Response<UnauthorizedError>(403, 'Access denied')
  public async getCaseDetails(
    @Path() reportId: string,
    @Request() request: express.Request,
  ): Promise<UserGetCaseDetailsResponse> {
    return this.service.getCaseDetails(reportId, request.user.id, false);
  }

  @Post('/{reportId}/actions')
  @ValidateBody(AddUserActionSchema)
  @Response<NotFoundError>(404, 'Report not found')
  @Response<ValidationError>(422, 'Validation error')
  @Response<UnauthorizedError>(403, 'Access denied')
  public async addAction(
    @Path() reportId: string,
    @Body() body: AddUserActionBody,
    @Request() request: express.Request,
  ): Promise<UserAddActionResponse> {
    return this.service.addAction(reportId, body, request.user.id, false);
  }

  @Post('/{reportId}/close')
  @Response<NotFoundError>(404, 'Report not found')
  @Response<ValidationError>(422, 'Case already closed')
  @Response<UnauthorizedError>(403, 'Access denied')
  public async closeCase(
    @Path() reportId: string,
    @Request() request: express.Request,
  ): Promise<UserCloseCaseResponse> {
    return this.service.closeCase(reportId, request.user.id);
  }

  @Post('/{reportId}/attachments')
  @Response<NotFoundError>(404, 'Report not found')
  @Response<ValidationError>(422, 'Validation error')
  @Response<UnauthorizedError>(403, 'Access denied')
  public async uploadAttachment(
    @Path() reportId: string,
    @UploadedFile('file') file: Express.Multer.File,
    @Request() request: express.Request,
    @Query() actionId?: string,
  ): Promise<UploadAttachmentResponse> {
    if (!file) {
      throw new BadRequestError(VALIDATION_MESSAGES.NO_FILE_UPLOADED);
    }
    return this.attachmentService.uploadAttachment(
      reportId,
      request.user.id,
      false,
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
      actionId,
    );
  }

  @Get('/{reportId}/attachments')
  @Response<NotFoundError>(404, 'Report not found')
  @Response<UnauthorizedError>(403, 'Access denied')
  public async listAttachments(
    @Path() reportId: string,
    @Request() request: express.Request,
  ): Promise<ListAttachmentsResponse> {
    return this.attachmentService.getAttachmentsByReportId(
      reportId,
      request.user.id,
      false,
    );
  }

  @Get('/{reportId}/attachments/{attachmentId}/url')
  @Response<NotFoundError>(404, 'Attachment not found')
  @Response<UnauthorizedError>(403, 'Access denied')
  public async getAttachmentUrl(
    @Path() reportId: string,
    @Path() attachmentId: string,
    @Request() request: express.Request,
  ): Promise<GetAttachmentUrlResponse> {
    return this.attachmentService.getAttachmentUrl(
      attachmentId,
      request.user.id,
      false,
    );
  }
}
