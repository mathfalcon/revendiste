/**
 * TicketReportsService tests with mocked repositories and external services.
 */
import {TicketReportsService} from '~/services/ticket-reports';
import type {TicketReportsRepository} from '~/repositories/ticket-reports';
import type {TicketReportActionsRepository} from '~/repositories/ticket-report-actions';
import type {TicketReportRefundsRepository} from '~/repositories/ticket-report-refunds';
import type {TicketReportAttachmentsRepository} from '~/repositories/ticket-report-attachments';
import type {OrderTicketReservationsRepository} from '~/repositories';
import type {OrdersRepository} from '~/repositories';
import type {PaymentsRepository} from '~/repositories';
import type {TicketDocumentsRepository} from '~/repositories/ticket-documents';
import type {NotificationService} from '~/services/notifications';
import type {DLocalService} from '~/services/dlocal';
import type {IStorageProvider} from '~/services/storage/IStorageProvider';
import {NotFoundError, UnauthorizedError, ValidationError} from '~/errors';
import type {Orders, Payments, OrderTicketReservations, ListingTickets, DB} from '@revendiste/shared';
import type {Selectable, Kysely} from 'kysely';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  createMockTicketReport,
  createMockTicketReportAction,
  createMockTicketReportRefund,
} from '../factories';

describe('TicketReportsService', () => {
  let service: TicketReportsService;
  let mockReportsRepo: jest.Mocked<TicketReportsRepository>;
  let mockActionsRepo: jest.Mocked<TicketReportActionsRepository>;
  let mockRefundsRepo: jest.Mocked<TicketReportRefundsRepository>;
  let mockAttachmentsRepo: jest.Mocked<TicketReportAttachmentsRepository>;
  let mockReservationsRepo: jest.Mocked<OrderTicketReservationsRepository>;
  let mockOrdersRepo: jest.Mocked<OrdersRepository>;
  let mockPaymentsRepo: jest.Mocked<PaymentsRepository>;
  let mockTicketDocumentsRepo: jest.Mocked<TicketDocumentsRepository>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockDLocalService: jest.Mocked<DLocalService>;
  let mockStorageProvider: jest.Mocked<IStorageProvider>;

  beforeEach(() => {
    mockReportsRepo = {
      create: jest.fn(),
      getById: jest.fn(),
      getByIdWithActions: jest.fn(),
      getByUserId: jest.fn(),
      getForAdmin: jest.fn(),
      updateStatus: jest.fn(),
      findActiveByEntity: jest.fn().mockResolvedValue(null),
      getEntityDetails: jest.fn().mockResolvedValue(null),
      getReporterInfo: jest.fn().mockResolvedValue(null),
      getTicketPrice: jest.fn().mockResolvedValue(null),
      withTransaction: jest.fn(),
      executeTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<TicketReportsRepository>;

    mockActionsRepo = {
      create: jest.fn(),
      getByReportId: jest.fn(),
      withTransaction: jest.fn(),
      executeTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<TicketReportActionsRepository>;

    mockRefundsRepo = {
      create: jest.fn(),
      createBatch: jest.fn(),
      updateStatus: jest.fn(),
      getByReportId: jest.fn(),
      getByReservationId: jest.fn(),
      withTransaction: jest.fn(),
      executeTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<TicketReportRefundsRepository>;

    mockAttachmentsRepo = {
      create: jest.fn(),
      getByReportId: jest.fn(),
      getById: jest.fn(),
      deleteById: jest.fn(),
      countByReportId: jest.fn(),
      withTransaction: jest.fn(),
      executeTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<TicketReportAttachmentsRepository>;

    mockReservationsRepo = {
      getByOrderId: jest.fn(),
      getById: jest.fn(),
      getByListingTicketId: jest.fn(),
      updateStatus: jest.fn(),
      withTransaction: jest.fn(),
      executeTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<OrderTicketReservationsRepository>;

    mockOrdersRepo = {
      getById: jest.fn(),
      withTransaction: jest.fn(),
      executeTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<OrdersRepository>;

    mockPaymentsRepo = {
      getByOrderId: jest.fn(),
      withTransaction: jest.fn(),
      executeTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<PaymentsRepository>;

    mockTicketDocumentsRepo = {
      getPrimaryDocument: jest.fn(),
      withTransaction: jest.fn(),
      executeTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<TicketDocumentsRepository>;

    mockNotificationService = {
      createNotification: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<NotificationService>;

    mockDLocalService = {
      createRefund: jest.fn(),
      getRefund: jest.fn(),
    } as unknown as jest.Mocked<DLocalService>;

    mockStorageProvider = {
      getUrl: jest.fn().mockResolvedValue('https://example.com/file.jpg'),
      upload: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IStorageProvider>;

    // executeTransaction delegates to callback with a stub Kysely instance
    mockReportsRepo.executeTransaction.mockImplementation(cb =>
      cb({} as unknown as Kysely<DB>),
    );
    mockReportsRepo.withTransaction.mockReturnValue(mockReportsRepo);
    mockActionsRepo.withTransaction.mockReturnValue(mockActionsRepo);
    mockRefundsRepo.withTransaction.mockReturnValue(mockRefundsRepo);
    mockReservationsRepo.withTransaction.mockReturnValue(mockReservationsRepo);

    service = new TicketReportsService(
      mockReportsRepo,
      mockActionsRepo,
      mockRefundsRepo,
      mockAttachmentsRepo,
      mockReservationsRepo,
      mockOrdersRepo,
      mockPaymentsRepo,
      mockTicketDocumentsRepo,
      mockNotificationService,
      mockDLocalService,
      mockStorageProvider,
    );
  });

  // ── createCase ──────────────────────────────────────────────────────────────

  describe('createCase', () => {
    it('creates a report with status awaiting_support and source user_report', async () => {
      const mockReport = createMockTicketReport({reportedByUserId: 'user-1'});
      mockOrdersRepo.getById.mockResolvedValue({id: 'entity-1', userId: 'user-1'} as unknown as Selectable<Orders>);
      mockReportsRepo.create.mockResolvedValue(mockReport);

      const result = await service.createCase(
        {caseType: 'other', entityType: 'order', entityId: 'entity-1'},
        'user-1',
      );

      expect(mockOrdersRepo.getById).toHaveBeenCalledWith('entity-1');
      expect(mockReportsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'awaiting_support',
          source: 'user_report',
          reportedByUserId: 'user-1',
        }),
      );
      expect(result).toEqual(mockReport);
    });

    it('fires a notification after creating the case', async () => {
      const mockReport = createMockTicketReport();
      mockOrdersRepo.getById.mockResolvedValue({id: 'entity-1', userId: 'user-1'} as unknown as Selectable<Orders>);
      mockReportsRepo.create.mockResolvedValue(mockReport);

      await service.createCase(
        {caseType: 'other', entityType: 'order', entityId: 'entity-1'},
        'user-1',
      );

      // Wait for the fire-and-forget notification
      await new Promise(r => setTimeout(r, 10));
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({type: 'ticket_report_created'}),
      );
    });

    it('throws NotFoundError when order does not exist', async () => {
      mockOrdersRepo.getById.mockResolvedValue(undefined);

      await expect(
        service.createCase(
          {caseType: 'other', entityType: 'order', entityId: 'nonexistent'},
          'user-1',
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws UnauthorizedError when user does not own the order', async () => {
      mockOrdersRepo.getById.mockResolvedValue({id: 'entity-1', userId: 'other-user'} as unknown as Selectable<Orders>);

      await expect(
        service.createCase(
          {caseType: 'other', entityType: 'order', entityId: 'entity-1'},
          'user-1',
        ),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('throws NotFoundError when reservation does not exist', async () => {
      mockReservationsRepo.getByListingTicketId.mockResolvedValue(undefined);

      await expect(
        service.createCase(
          {caseType: 'other', entityType: 'order_ticket_reservation', entityId: 'nonexistent'},
          'user-1',
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws UnauthorizedError when user does not own the reservation', async () => {
      mockReservationsRepo.getByListingTicketId.mockResolvedValue({id: 'res-1', orderId: 'order-1'} as unknown as Selectable<OrderTicketReservations>);
      mockOrdersRepo.getById.mockResolvedValue({id: 'order-1', userId: 'other-user'} as unknown as Selectable<Orders>);

      await expect(
        service.createCase(
          {caseType: 'other', entityType: 'order_ticket_reservation', entityId: 'res-1'},
          'user-1',
        ),
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  // ── addAction: comment by user ──────────────────────────────────────────────

  describe('addAction - comment by user', () => {
    it('sets status to awaiting_support when user comments', async () => {
      const report = createMockTicketReport({
        status: 'awaiting_customer',
        reportedByUserId: 'user-1',
      });
      mockReportsRepo.getById.mockResolvedValue(report);
      mockReportsRepo.updateStatus.mockResolvedValue({...report, status: 'awaiting_support'});
      mockActionsRepo.create.mockResolvedValue(createMockTicketReportAction());

      await service.addAction(report.id, {actionType: 'comment', comment: 'hola'}, 'user-1', false);

      expect(mockReportsRepo.updateStatus).toHaveBeenCalledWith(
        report.id,
        'awaiting_support',
        undefined,
      );
    });

    it('throws UnauthorizedError when user does not own the report', async () => {
      const report = createMockTicketReport({reportedByUserId: 'user-1'});
      mockReportsRepo.getById.mockResolvedValue(report);

      await expect(
        service.addAction(report.id, {actionType: 'comment'}, 'other-user', false),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('throws ValidationError when user tries admin-only action type', async () => {
      const report = createMockTicketReport({reportedByUserId: 'user-1'});
      mockReportsRepo.getById.mockResolvedValue(report);

      await expect(
        service.addAction(report.id, {actionType: 'refund_full'}, 'user-1', false),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ── addAction: comment by admin ─────────────────────────────────────────────

  describe('addAction - comment by admin', () => {
    it('sets status to awaiting_customer when admin comments', async () => {
      const report = createMockTicketReport({status: 'awaiting_support'});
      mockReportsRepo.getById.mockResolvedValue(report);
      mockReportsRepo.updateStatus.mockResolvedValue({...report, status: 'awaiting_customer'});
      mockActionsRepo.create.mockResolvedValue(createMockTicketReportAction());

      await service.addAction(report.id, {actionType: 'comment', comment: 'info'}, 'admin-1', true);

      expect(mockReportsRepo.updateStatus).toHaveBeenCalledWith(
        report.id,
        'awaiting_customer',
        undefined,
      );
    });
  });

  // ── addAction: close / reject ───────────────────────────────────────────────

  describe('addAction - close/reject', () => {
    it.each(['close', 'reject'] as const)(
      'sets status to closed and sets closedAt for action "%s"',
      async actionType => {
        const report = createMockTicketReport({status: 'awaiting_support'});
        mockReportsRepo.getById.mockResolvedValue(report);
        mockReportsRepo.updateStatus.mockResolvedValue({...report, status: 'closed', closedAt: new Date()});
        mockActionsRepo.create.mockResolvedValue(createMockTicketReportAction({actionType}));

        await service.addAction(report.id, {actionType}, 'admin-1', true);

        expect(mockReportsRepo.updateStatus).toHaveBeenCalledWith(
          report.id,
          'closed',
          expect.any(Date),
        );
      },
    );

    it('throws ValidationError if case is already closed', async () => {
      const report = createMockTicketReport({status: 'closed'});
      mockReportsRepo.getById.mockResolvedValue(report);

      await expect(
        service.addAction(report.id, {actionType: 'close'}, 'admin-1', true),
      ).rejects.toThrow(ValidationError);

      expect(mockReportsRepo.updateStatus).not.toHaveBeenCalled();
    });
  });

  // ── addAction: refund_full ───────────────────────────────────────────────────

  describe('addAction - refund_full', () => {
    it('calls createRefund, creates refund records, updates reservation, closes case', async () => {
      const report = createMockTicketReport({
        id: 'report-1',
        status: 'awaiting_support',
        entityType: 'order',
        entityId: 'order-1',
      });
      mockReportsRepo.getById.mockResolvedValue(report);
      mockReportsRepo.updateStatus.mockResolvedValue({...report, status: 'closed'});
      mockActionsRepo.create.mockResolvedValue(createMockTicketReportAction({actionType: 'refund_full'}));

      mockReservationsRepo.getByOrderId.mockResolvedValue([
        {id: 'res-1', status: 'active', orderId: 'order-1', listingTicketId: 'lt-1'} as unknown as Awaited<ReturnType<OrderTicketReservationsRepository['getByOrderId']>>[number],
      ]);
      mockReportsRepo.getTicketPrice.mockResolvedValue({price: '575'} as unknown as Pick<Selectable<ListingTickets>, 'price'>);
      mockOrdersRepo.getById.mockResolvedValue({id: 'order-1', currency: 'UYU'} as unknown as Selectable<Orders>);
      mockRefundsRepo.create.mockResolvedValue(createMockTicketReportRefund());
      mockPaymentsRepo.getByOrderId.mockResolvedValue({
        id: 'payment-1',
        providerPaymentId: 'dlocal-123',
        currency: 'UYU',
      } as unknown as Selectable<Payments>);
      mockDLocalService.createRefund.mockResolvedValue({
        id: 'refund-1',
        status: 'PAID',
      } as unknown as Awaited<ReturnType<DLocalService['createRefund']>>);
      mockRefundsRepo.updateStatus.mockResolvedValue(createMockTicketReportRefund({refundStatus: 'refunded'}));

      await service.addAction(report.id, {actionType: 'refund_full'}, 'admin-1', true);
      // executeDLocalRefunds is fire-and-forget — flush microtasks/promises to let it complete
      await new Promise(r => setTimeout(r, 10));

      expect(mockDLocalService.createRefund).toHaveBeenCalledWith(
        expect.objectContaining({paymentId: 'dlocal-123'}),
      );
      expect(mockRefundsRepo.create).toHaveBeenCalled();
      expect(mockReservationsRepo.updateStatus).toHaveBeenCalledWith('res-1', 'refund_pending');
      expect(mockRefundsRepo.updateStatus).toHaveBeenCalledWith(
        expect.any(String),
        'refunded',
        expect.any(Date),
        expect.any(Number), // refundAmount (ticket price)
      );
      expect(mockReservationsRepo.updateStatus).toHaveBeenCalledWith('res-1', 'refunded');
      expect(mockReportsRepo.updateStatus).toHaveBeenCalledWith(
        report.id,
        'closed',
        expect.any(Date),
      );
    });

    it('marks refund as skipped (not throws) when dLocal fails', async () => {
      const report = createMockTicketReport({
        entityType: 'order',
        entityId: 'order-1',
        status: 'awaiting_support',
      });
      mockReportsRepo.getById.mockResolvedValue(report);
      mockReportsRepo.updateStatus.mockResolvedValue({...report, status: 'closed'});
      mockActionsRepo.create.mockResolvedValue(createMockTicketReportAction());

      mockReservationsRepo.getByOrderId.mockResolvedValue([
        {id: 'res-1', status: 'active', orderId: 'order-1', listingTicketId: 'lt-1'} as unknown as Awaited<ReturnType<OrderTicketReservationsRepository['getByOrderId']>>[number],
      ]);
      mockReportsRepo.getTicketPrice.mockResolvedValue({price: '575'} as unknown as Pick<Selectable<ListingTickets>, 'price'>);
      mockOrdersRepo.getById.mockResolvedValue({id: 'order-1', currency: 'UYU'} as unknown as Selectable<Orders>);
      mockRefundsRepo.create.mockResolvedValue(createMockTicketReportRefund());
      mockPaymentsRepo.getByOrderId.mockResolvedValue({
        providerPaymentId: 'dlocal-123',
        currency: 'UYU',
      } as unknown as Selectable<Payments>);
      mockDLocalService.createRefund.mockRejectedValue(new Error('dLocal unavailable'));
      mockRefundsRepo.updateStatus.mockResolvedValue(createMockTicketReportRefund({refundStatus: 'skipped'}));

      // Should NOT throw
      await expect(
        service.addAction(report.id, {actionType: 'refund_full'}, 'admin-1', true),
      ).resolves.not.toThrow();

      expect(mockRefundsRepo.updateStatus).toHaveBeenCalledWith(
        expect.any(String),
        'skipped',
        expect.any(Date),
      );
    });
  });

  // ── closeCase ───────────────────────────────────────────────────────────────

  describe('closeCase', () => {
    it('closes the case when user owns it', async () => {
      const report = createMockTicketReport({reportedByUserId: 'user-1', status: 'awaiting_support'});
      mockReportsRepo.getById.mockResolvedValue(report);
      mockReportsRepo.updateStatus.mockResolvedValue({...report, status: 'closed'});
      mockActionsRepo.create.mockResolvedValue(createMockTicketReportAction());

      await service.closeCase(report.id, 'user-1');

      expect(mockReportsRepo.updateStatus).toHaveBeenCalledWith(
        report.id,
        'closed',
        expect.any(Date),
      );
    });

    it('throws UnauthorizedError when user does not own the report', async () => {
      const report = createMockTicketReport({reportedByUserId: 'user-1'});
      mockReportsRepo.getById.mockResolvedValue(report);

      await expect(service.closeCase(report.id, 'other-user')).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('throws ValidationError when case is already closed', async () => {
      const report = createMockTicketReport({reportedByUserId: 'user-1', status: 'closed'});
      mockReportsRepo.getById.mockResolvedValue(report);

      await expect(service.closeCase(report.id, 'user-1')).rejects.toThrow(
        ValidationError,
      );
    });

    it('throws NotFoundError when report does not exist', async () => {
      mockReportsRepo.getById.mockResolvedValue(undefined);

      await expect(service.closeCase('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
