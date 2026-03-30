/**
 * Send-notification job handler tests: attachment resolution and post-send actions.
 */
import { PostSendActionSchema } from '@revendiste/shared';
import { createSendNotificationHandler } from '~/services/job-handlers/send-notification';
import type { NotificationService } from '~/services/notifications/NotificationService';
import type { NotificationsRepository } from '~/repositories/notifications';
import type { IStorageProvider } from '~/services/storage/IStorageProvider';
import type { PostSendActionRunners } from '~/services/job-handlers/send-notification';

describe('createSendNotificationHandler', () => {
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockNotificationsRepository: jest.Mocked<NotificationsRepository>;
  let mockStorageProvider: jest.Mocked<IStorageProvider>;
  let mockPostSendActionRunners: PostSendActionRunners;

  beforeEach(() => {
    mockNotificationService = {
      sendNotification: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<NotificationService>;

    mockNotificationsRepository = {
      getById: jest.fn(),
      withTransaction: jest.fn(),
      getDb: jest.fn(),
    } as unknown as jest.Mocked<NotificationsRepository>;

    mockStorageProvider = {
      getBuffer: jest.fn(),
      upload: jest.fn(),
    } as unknown as jest.Mocked<IStorageProvider>;

    mockPostSendActionRunners = {
      markInvoiceEmailSent: jest.fn().mockResolvedValue(undefined),
    };
  });

  it('returns without sending when notification is not found', async () => {
    mockNotificationsRepository.getById.mockResolvedValue(undefined);

    const handler = createSendNotificationHandler(
      mockNotificationService,
      mockNotificationsRepository,
      mockStorageProvider,
      mockPostSendActionRunners,
    );

    await handler({
      notificationId: '00000000-0000-0000-0000-000000000001',
    } as any);

    expect(mockNotificationsRepository.getById).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000001',
    );
    expect(mockNotificationService.sendNotification).not.toHaveBeenCalled();
    expect(mockPostSendActionRunners.markInvoiceEmailSent).not.toHaveBeenCalled();
  });

  it('resolves storage attachments, sends notification, and runs post-send actions', async () => {
    const notificationId = '00000000-0000-0000-0000-000000000002';
    // Use a UUID that passes Zod 4's stricter uuid() validation (e.g. valid variant/version bits)
    const invoiceId = '550e8400-e29b-41d4-a716-446655440000';
    const pdfBuffer = Buffer.from('pdf-content');
    const postSendActions = [
      { type: 'markInvoiceEmailSent' as const, invoiceId },
    ];
    const notification = {
      id: notificationId,
      metadata: {
        attachmentRefs: [
          {
            type: 'storage',
            storagePath: 'invoices/order-1/buyer-invoice.pdf',
            filename: 'factura.pdf',
          },
        ],
        postSendActions,
      },
    } as any;

    const parseResult = PostSendActionSchema.array().safeParse(postSendActions);
    expect(parseResult.success).toBe(true);

    mockNotificationsRepository.getById.mockResolvedValue(notification);
    mockStorageProvider.getBuffer.mockResolvedValue(pdfBuffer);

    const handler = createSendNotificationHandler(
      mockNotificationService,
      mockNotificationsRepository,
      mockStorageProvider,
      mockPostSendActionRunners,
    );

    await handler({ notificationId } as any);

    expect(mockStorageProvider.getBuffer).toHaveBeenCalledWith(
      'invoices/order-1/buyer-invoice.pdf',
    );
    expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
      notificationId,
      [
        {
          filename: 'factura.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    );
    expect(mockPostSendActionRunners.markInvoiceEmailSent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'markInvoiceEmailSent',
        invoiceId,
      }),
    );
  });

  it('sends notification with no attachments when metadata has no attachmentRefs', async () => {
    const notificationId = '00000000-0000-0000-0000-000000000003';
    const notification = {
      id: notificationId,
      metadata: {},
    } as any;

    mockNotificationsRepository.getById.mockResolvedValue(notification);

    const handler = createSendNotificationHandler(
      mockNotificationService,
      mockNotificationsRepository,
      mockStorageProvider,
      mockPostSendActionRunners,
    );

    await handler({ notificationId } as any);

    expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
      notificationId,
      [],
    );
    expect(mockStorageProvider.getBuffer).not.toHaveBeenCalled();
  });
});
