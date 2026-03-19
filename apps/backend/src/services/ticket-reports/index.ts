import type {
  TicketReportStatus,
  TicketReportCaseType,
  TicketReportActionType,
  TicketReportEntityType,
  TicketReportSource,
} from '@revendiste/shared';
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ConflictError,
} from '~/errors';
import {TICKET_REPORT_ERROR_MESSAGES} from '~/constants/error-messages';
import {logger} from '~/utils';
import type {TicketReportsRepository} from '~/repositories/ticket-reports';
import type {TicketReportActionsRepository} from '~/repositories/ticket-report-actions';
import type {TicketReportRefundsRepository} from '~/repositories/ticket-report-refunds';
import type {TicketReportAttachmentsRepository} from '~/repositories/ticket-report-attachments';
import type {OrderTicketReservationsRepository} from '~/repositories/order-ticket-reservations';
import type {OrdersRepository} from '~/repositories/orders';
import type {PaymentsRepository} from '~/repositories/payments';
import type {TicketDocumentsRepository} from '~/repositories/ticket-documents';
import type {NotificationService} from '~/services/notifications';
import type {DLocalService} from '~/services/dlocal';
import type {IStorageProvider} from '~/services/storage/IStorageProvider';
import {
  notifyTicketReportCreated,
  notifyTicketReportStatusChanged,
  notifyTicketReportActionAdded,
  notifyTicketReportClosed,
} from '~/services/notifications/helpers';
import type {PaginationOptions} from '~/types/pagination';

export interface CreateCaseData {
  caseType: TicketReportCaseType;
  entityType: TicketReportEntityType;
  entityId: string;
  description?: string;
  source?: TicketReportSource;
}

export interface CreateAutoCaseData {
  caseType: TicketReportCaseType;
  entityType: TicketReportEntityType;
  entityId: string;
  source: 'auto_missing_document';
  reservationIds: string[];
  /** The buyer's userId — when set, they can view the case and receive notifications */
  reportedByUserId?: string | null;
  /** Event name for the buyer notification email */
  eventName?: string;
}

export interface AddActionData {
  actionType: TicketReportActionType;
  comment?: string;
  metadata?: {
    refundAmount?: number;
    refundReason?: string;
    reservationIds?: string[];
  };
}

export class TicketReportsService {
  constructor(
    private readonly ticketReportsRepository: TicketReportsRepository,
    private readonly ticketReportActionsRepository: TicketReportActionsRepository,
    private readonly ticketReportRefundsRepository: TicketReportRefundsRepository,
    private readonly ticketReportAttachmentsRepository: TicketReportAttachmentsRepository,
    private readonly orderTicketReservationsRepository: OrderTicketReservationsRepository,
    private readonly ordersRepository: OrdersRepository,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly ticketDocumentsRepository: TicketDocumentsRepository,
    private readonly notificationService: NotificationService,
    private readonly dLocalService: DLocalService,
    private readonly storageProvider: IStorageProvider,
  ) {}

  async createCase(data: CreateCaseData, userId: string) {
    // Check for existing active report on the same entity
    const existingReport = await this.ticketReportsRepository.findActiveByEntity(
      data.entityType,
      data.entityId,
    );
    if (existingReport) {
      throw new ConflictError(
        TICKET_REPORT_ERROR_MESSAGES.DUPLICATE_ACTIVE_REPORT,
        {existingReportId: existingReport.id},
      );
    }

    // Verify ownership of the entity being reported
    if (data.entityType === 'order') {
      const order = await this.ordersRepository.getById(data.entityId);
      if (!order) {
        throw new NotFoundError(TICKET_REPORT_ERROR_MESSAGES.ENTITY_NOT_FOUND);
      }
      if (order.userId !== userId) {
        throw new UnauthorizedError(
          TICKET_REPORT_ERROR_MESSAGES.UNAUTHORIZED_ENTITY_ACCESS,
        );
      }
    } else if (data.entityType === 'order_ticket_reservation') {
      // entityId is the listing ticket ID (the ID visible to the user)
      const reservation =
        await this.orderTicketReservationsRepository.getByListingTicketId(
          data.entityId,
        );
      if (!reservation) {
        throw new NotFoundError(TICKET_REPORT_ERROR_MESSAGES.ENTITY_NOT_FOUND);
      }
      // Get the order to check ownership
      const order = await this.ordersRepository.getById(reservation.orderId);
      if (!order) {
        throw new NotFoundError(TICKET_REPORT_ERROR_MESSAGES.ENTITY_NOT_FOUND);
      }
      if (order.userId !== userId) {
        throw new UnauthorizedError(
          TICKET_REPORT_ERROR_MESSAGES.UNAUTHORIZED_ENTITY_ACCESS,
        );
      }

      // "invalid_ticket" only makes sense if the ticket actually has a document
      if (data.caseType === 'invalid_ticket') {
        const doc =
          await this.ticketDocumentsRepository.getPrimaryDocument(
            data.entityId,
          );
        if (!doc) {
          throw new ValidationError(
            TICKET_REPORT_ERROR_MESSAGES.INVALID_TICKET_NO_DOCUMENT,
          );
        }
      }
    }
    // For listing and listing_ticket entity types, no ownership check for now
    // (these might be admin-only or future features)

    const report = await this.ticketReportsRepository.create({
      status: 'awaiting_support',
      caseType: data.caseType,
      entityType: data.entityType,
      entityId: data.entityId,
      reportedByUserId: userId,
      description: data.description,
      source: data.source ?? 'user_report',
    });

    notifyTicketReportCreated(this.notificationService, {
      ticketReportId: report.id,
      caseType: report.caseType,
      reportedByUserId: userId,
      entityType: report.entityType,
      entityId: report.entityId,
    }).catch(err =>
      logger.error('Failed to send ticket_report_created notification', {err}),
    );

    return report;
  }

  /**
   * Creates a system-generated auto-case (no reporter user).
   * Used by cronjobs (e.g. missing document after event end) to create cases
   * that admins can act on. Also creates pending refund records for each reservation.
   */
  async createAutoCase(data: CreateAutoCaseData) {
    // Check if an active report already exists for this entity
    const existingReport = await this.ticketReportsRepository.findActiveByEntity(
      data.entityType,
      data.entityId,
    );
    if (existingReport) {
      return existingReport;
    }

    const report = await this.ticketReportsRepository.create({
      status: 'awaiting_support',
      caseType: data.caseType,
      entityType: data.entityType,
      entityId: data.entityId,
      reportedByUserId: data.reportedByUserId ?? null,
      source: data.source,
    });

    // Create pending refund records for each affected reservation
    if (data.reservationIds.length > 0) {
      await this.ticketReportRefundsRepository.createBatch(
        data.reservationIds.map(reservationId => ({
          ticketReportId: report.id,
          orderTicketReservationId: reservationId,
          refundStatus: 'pending' as const,
        })),
      );
    }

    // Notify the buyer — they didn't open this case, so we need to proactively
    // tell them what happened and reassure them their money is coming back
    if (data.reportedByUserId) {
      notifyTicketReportCreated(this.notificationService, {
        ticketReportId: report.id,
        caseType: report.caseType,
        reportedByUserId: data.reportedByUserId,
        entityType: report.entityType,
        entityId: report.entityId,
        isAutoCase: true,
        eventName: data.eventName,
      }).catch(err =>
        logger.error('Failed to send auto-case created notification to buyer', {err}),
      );
    }

    logger.info('Created auto-case for missing documents', {
      ticketReportId: report.id,
      entityType: data.entityType,
      entityId: data.entityId,
      reservationCount: data.reservationIds.length,
      reportedByUserId: data.reportedByUserId ?? null,
    });

    return report;
  }

  async checkExistingReport(entityType: TicketReportEntityType, entityId: string) {
    const existing = await this.ticketReportsRepository.findActiveByEntity(
      entityType,
      entityId,
    );
    if (existing) {
      return {exists: true as const, reportId: existing.id, status: existing.status};
    }
    return {exists: false as const};
  }

  async addAction(
    reportId: string,
    data: AddActionData,
    performedByUserId: string,
    isAdmin: boolean,
  ) {
    const report = await this.ticketReportsRepository.getById(reportId);
    if (!report) {
      throw new NotFoundError(TICKET_REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND);
    }

    // Non-admins can only comment or close their own case
    if (!isAdmin) {
      if (report.reportedByUserId !== performedByUserId) {
        throw new UnauthorizedError(
          TICKET_REPORT_ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
        );
      }
      if (data.actionType !== 'comment' && data.actionType !== 'close') {
        throw new ValidationError(
          TICKET_REPORT_ERROR_MESSAGES.INVALID_ACTION_FOR_USER,
        );
      }
    }

    if (
      report.status === 'closed' &&
      data.actionType !== 'comment' // allow comments on closed cases for audit
    ) {
      throw new ValidationError(TICKET_REPORT_ERROR_MESSAGES.ALREADY_CLOSED);
    }

    const prevStatus = report.status;
    let newStatus: TicketReportStatus = report.status;

    if (data.actionType === 'close' || data.actionType === 'reject') {
      newStatus = 'closed';
    } else if (
      data.actionType === 'refund_partial' ||
      data.actionType === 'refund_full'
    ) {
      newStatus = 'closed';
    } else if (data.actionType === 'comment') {
      if (report.status !== 'closed') {
        newStatus = isAdmin ? 'awaiting_customer' : 'awaiting_support';
      }
    }

    const isRefund =
      data.actionType === 'refund_partial' ||
      data.actionType === 'refund_full';

    const result = await this.ticketReportsRepository.executeTransaction(
      async trx => {
        const reportsRepo = this.ticketReportsRepository.withTransaction(trx);
        const actionsRepo =
          this.ticketReportActionsRepository.withTransaction(trx);
        const refundsRepo =
          this.ticketReportRefundsRepository.withTransaction(trx);
        const reservationsRepo =
          this.orderTicketReservationsRepository.withTransaction(trx);

        if (isRefund) {
          await this.processRefund(
            {
              id: report.id,
              entityType: report.entityType,
              entityId: report.entityId,
            },
            data,
            {refundsRepo, reservationsRepo},
          );
        }

        const updatedReport = await reportsRepo.updateStatus(
          reportId,
          newStatus,
          newStatus === 'closed' ? new Date() : undefined,
        );

        const action = await actionsRepo.create({
          ticketReportId: reportId,
          performedByUserId,
          actionType: data.actionType,
          comment: data.comment ?? null,
          metadata: data.metadata ?? null,
        });

        return {report: updatedReport, action};
      },
    );

    // Fire notifications outside the transaction
    // Skip reporter-targeted notifications for auto-cases (reportedByUserId is null)
    const performedByRole: 'admin' | 'user' = isAdmin ? 'admin' : 'user';
    const reporterId = report.reportedByUserId;

    if (reporterId && newStatus !== prevStatus) {
      notifyTicketReportStatusChanged(this.notificationService, {
        ticketReportId: reportId,
        reportedByUserId: reporterId,
        oldStatus: prevStatus,
        newStatus,
      }).catch(err =>
        logger.error('Failed to send ticket_report_status_changed notification', {err}),
      );
    }

    if (reporterId && newStatus === 'closed' && isAdmin) {
      // Only notify user when admin closes their report
      // Don't notify users when they close their own report
      notifyTicketReportClosed(this.notificationService, {
        ticketReportId: reportId,
        reportedByUserId: reporterId,
        closedByRole: performedByRole,
        actionType: data.actionType,
        refundIssued: isRefund,
      }).catch(err =>
        logger.error('Failed to send ticket_report_closed notification', {err}),
      );
    } else if (newStatus !== 'closed' && isAdmin && reporterId) {
      // Only notify when admin adds action to user's report
      // Don't notify users about their own actions
      notifyTicketReportActionAdded(this.notificationService, {
        ticketReportId: reportId,
        notifyUserId: reporterId,
        actionType: data.actionType,
        performedByRole,
        comment: data.comment,
      }).catch(err =>
        logger.error('Failed to send ticket_report_action_added notification', {err}),
      );
    }

    return result;
  }

  async closeCase(reportId: string, userId: string) {
    const report = await this.ticketReportsRepository.getById(reportId);
    if (!report) {
      throw new NotFoundError(TICKET_REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND);
    }
    if (report.reportedByUserId !== userId) {
      throw new UnauthorizedError(
        TICKET_REPORT_ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
      );
    }
    if (report.status === 'closed') {
      throw new ValidationError(TICKET_REPORT_ERROR_MESSAGES.ALREADY_CLOSED);
    }
    return this.addAction(
      reportId,
      {actionType: 'close'},
      userId,
      false,
    );
  }

  async listCasesForAdmin(
    filters: {status?: TicketReportStatus; caseType?: TicketReportCaseType},
    pagination: PaginationOptions,
  ) {
    return this.ticketReportsRepository.getForAdmin(
      {
        status: filters.status,
        caseType: filters.caseType,
      },
      pagination,
    );
  }

  async listCasesForUser(userId: string, pagination: PaginationOptions) {
    return this.ticketReportsRepository.getByUserId(userId, pagination);
  }

  async getCaseDetails(
    reportId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<{
    id: string;
    status: TicketReportStatus;
    caseType: TicketReportCaseType;
    entityType: TicketReportEntityType;
    entityId: string;
    reportedByUserId: string | null;
    description: string | null;
    source: TicketReportSource;
    closedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    actions: Array<{
      id: string;
      ticketReportId: string;
      performedByUserId: string;
      actionType: TicketReportActionType;
      comment: string | null;
      metadata: any;
      createdAt: Date;
      attachments: Array<{
        id: string;
        fileName: string;
        originalName: string;
        mimeType: string;
        sizeBytes: number;
        createdAt: Date;
      }>;
    }>;
    initialAttachments: Array<{
      id: string;
      fileName: string;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
      createdAt: Date;
    }>;
    entityDetails: any;
  }> {
    const report =
      await this.ticketReportsRepository.getByIdWithActions(reportId);
    if (!report) {
      throw new NotFoundError(TICKET_REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND);
    }
    if (!isAdmin && report.reportedByUserId !== userId) {
      throw new UnauthorizedError(
        TICKET_REPORT_ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
      );
    }

    // Fetch entity details based on entityType
    const entityDetails = await this.ticketReportsRepository.getEntityDetails(
      report.entityType,
      report.entityId,
    );

    // Fetch all attachments for this report
    const allAttachments =
      await this.ticketReportAttachmentsRepository.getByReportId(reportId);

    // Group attachments by action ID and add URLs
    const attachmentsByAction = new Map<
      string,
      Array<{
        id: string;
        fileName: string;
        originalName: string;
        mimeType: string;
        sizeBytes: number;
        createdAt: Date;
        url: string;
      }>
    >();

    const initialAttachments: Array<{
      id: string;
      fileName: string;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
      createdAt: Date;
      url: string;
    }> = [];

    for (const att of allAttachments) {
      const url = await this.storageProvider.getUrl(att.storagePath);
      const attachmentData = {
        id: att.id,
        fileName: att.fileName,
        originalName: att.originalName,
        mimeType: att.mimeType,
        sizeBytes: att.sizeBytes,
        createdAt: att.createdAt,
        url,
      };

      if (att.ticketReportActionId) {
        const existing = attachmentsByAction.get(att.ticketReportActionId) || [];
        existing.push(attachmentData);
        attachmentsByAction.set(att.ticketReportActionId, existing);
      } else {
        initialAttachments.push(attachmentData);
      }
    }

    // Add attachments to each action
    const actionsWithAttachments = (report.actions as any[]).map(action => ({
      ...action,
      attachments: attachmentsByAction.get(action.id) || [],
    }));

    return {
      id: report.id,
      status: report.status,
      caseType: report.caseType,
      entityType: report.entityType,
      entityId: report.entityId,
      reportedByUserId: report.reportedByUserId,
      description: report.description,
      source: report.source,
      closedAt: report.closedAt,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      actions: actionsWithAttachments,
      initialAttachments,
      entityDetails: entityDetails || null,
    };
  }

  private async processRefund(
    report: {id: string; entityType: string; entityId: string},
    data: AddActionData,
    repos: {
      refundsRepo: TicketReportRefundsRepository;
      reservationsRepo: OrderTicketReservationsRepository;
    },
  ) {
    // Build a map of reservationId -> orderId so we can look up payments correctly
    const reservationOrderMap = new Map<string, string>();

    let reservationIds: string[] = [];

    if (data.actionType === 'refund_partial') {
      reservationIds = data.metadata?.reservationIds ?? [];
      // Look up orderId for each reservation
      for (const reservationId of reservationIds) {
        const reservation = await repos.reservationsRepo.getById(reservationId);
        if (reservation?.orderId) {
          reservationOrderMap.set(reservationId, reservation.orderId);
        }
      }
    } else {
      // refund_full: get all active reservations for the entity
      if (report.entityType === 'order') {
        const reservations = await repos.reservationsRepo.getByOrderId(report.entityId);
        const activeReservations = reservations.filter(
          r => (r as {status?: string}).status === 'active',
        );
        reservationIds = activeReservations.map(r => r.id);
        // All share the same orderId
        for (const r of activeReservations) {
          reservationOrderMap.set(r.id, report.entityId);
        }
      } else if (report.entityType === 'order_ticket_reservation') {
        // entityId is the listing ticket ID — look up the reservation by ticket
        const reservation = await repos.reservationsRepo.getByListingTicketId(report.entityId);
        if (reservation && (reservation as {status?: string}).status === 'active') {
          reservationIds = [reservation.id];
          if (reservation.orderId) {
            reservationOrderMap.set(reservation.id, reservation.orderId);
          }
        }
      }
    }

    for (const reservationId of reservationIds) {
      try {
        // Mark reservation as refund_pending
        await repos.reservationsRepo.updateStatus(
          reservationId,
          'refund_pending',
        );

        // Create a pending refund record
        const refundRecord = await repos.refundsRepo.create({
          ticketReportId: report.id,
          orderTicketReservationId: reservationId,
          refundStatus: 'pending',
          refundAmount: data.metadata?.refundAmount ?? null,
        });

        // Attempt dLocal refund using the correct orderId for payment lookup
        const orderId = reservationOrderMap.get(reservationId);
        try {
          const payment = orderId
            ? await this.paymentsRepository.getByOrderId(orderId)
            : null;

          if (payment) {
            await this.dLocalService.createRefund({
              paymentId: payment.providerPaymentId ?? '',
              amount: data.metadata?.refundAmount,
              currency: payment.currency ?? undefined,
              reason: data.metadata?.refundReason,
            });

            await repos.refundsRepo.updateStatus(
              refundRecord.id,
              'refunded',
              new Date(),
              data.metadata?.refundAmount,
            );

            await repos.reservationsRepo.updateStatus(
              reservationId,
              'refunded',
            );
          } else {
            // No payment found - mark as skipped
            logger.warn('No payment found for reservation during refund', {
              reservationId,
              ticketReportId: report.id,
            });
            await repos.refundsRepo.updateStatus(
              refundRecord.id,
              'skipped',
              new Date(),
            );
          }
        } catch (refundErr) {
          logger.error('dLocal refund failed for reservation', {
            reservationId,
            ticketReportId: report.id,
            error: refundErr,
          });
          await repos.refundsRepo.updateStatus(
            refundRecord.id,
            'skipped',
            new Date(),
          );
        }
      } catch (err) {
        logger.error('Failed to process refund for reservation', {
          reservationId,
          ticketReportId: report.id,
          error: err,
        });
      }
    }
  }
}
