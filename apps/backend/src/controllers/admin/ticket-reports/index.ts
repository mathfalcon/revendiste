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
  Query,
  UploadedFile,
} from '@mathfalcon/tsoa-runtime';
import {TicketReportsService} from '~/services/ticket-reports';
import {NotificationService} from '~/services/notifications';
import {DLocalService} from '~/services/dlocal';
import {
  requireAuthMiddleware,
  requireAdminMiddleware,
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
import {TicketReportAttachmentsService} from '~/services/ticket-report-attachments';
import {getStorageProvider} from '~/services/storage/StorageFactory';
import {db} from '~/db';
import {NotFoundError, ValidationError, UnauthorizedError} from '~/errors';
import {
  TICKET_REPORT_ERROR_MESSAGES,
  VALIDATION_MESSAGES,
} from '~/constants/error-messages';
import {ValidateBody, ValidateQuery, Body} from '~/decorators';
import {
  AddAdminActionBody,
  AddAdminActionSchema,
  AdminListTicketReportsQuery,
  AdminListTicketReportsRouteSchema,
} from './validation';

type AdminListCasesResponse = ReturnType<
  TicketReportsService['listCasesForAdmin']
>;
type AdminGetCaseDetailsResponse = ReturnType<
  TicketReportsService['getCaseDetails']
>;
type AdminAddActionResponse = ReturnType<TicketReportsService['addAction']>;
type AdminListAttachmentsResponse = ReturnType<
  TicketReportAttachmentsService['getAttachmentsByReportId']
>;
type AdminUploadAttachmentResponse = ReturnType<
  TicketReportAttachmentsService['uploadAttachment']
>;

const notificationsRepository = new NotificationsRepository(db);
const usersRepository = new UsersRepository(db);
const notificationService = new NotificationService(
  notificationsRepository,
  usersRepository,
);

@Route('admin/ticket-reports')
@Middlewares(requireAuthMiddleware, requireAdminMiddleware)
@Tags('Admin - Ticket Reports')
export class AdminTicketReportsController {
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

  @Get('/')
  @ValidateQuery(AdminListTicketReportsRouteSchema)
  @Middlewares(paginationMiddleware(20, 100), ensurePagination)
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async listCases(
    @Queries() query: AdminListTicketReportsQuery,
    @Request() request: express.Request,
  ): Promise<AdminListCasesResponse> {
    return this.service.listCasesForAdmin(
      {status: query.status, caseType: query.caseType},
      request.pagination!,
    );
  }

  @Get('/{reportId}')
  @Response<NotFoundError>(404, 'Report not found')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async getCaseDetails(
    @Path() reportId: string,
    @Request() request: express.Request,
  ): Promise<AdminGetCaseDetailsResponse> {
    return this.service.getCaseDetails(reportId, request.user.id, true);
  }

  @Post('/{reportId}/actions')
  @ValidateBody(AddAdminActionSchema)
  @Response<NotFoundError>(404, 'Report not found')
  @Response<ValidationError>(422, 'Validation error')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async addAction(
    @Path() reportId: string,
    @Body() body: AddAdminActionBody,
    @Request() request: express.Request,
  ): Promise<AdminAddActionResponse> {
    return this.service.addAction(reportId, body, request.user.id, true);
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
  ): Promise<AdminUploadAttachmentResponse> {
    if (!file) {
      throw new ValidationError(VALIDATION_MESSAGES.NO_FILE_UPLOADED);
    }
    return this.attachmentService.uploadAttachment(
      reportId,
      request.user.id,
      true,
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
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<UnauthorizedError>(403, 'Admin access required')
  public async listAttachments(
    @Path() reportId: string,
    @Request() request: express.Request,
  ): Promise<AdminListAttachmentsResponse> {
    return this.attachmentService.getAttachmentsByReportId(
      reportId,
      request.user.id,
      true,
    );
  }
}
