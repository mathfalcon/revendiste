import type { JobHandler } from '~/services/job-queue';
import type { NotificationService } from '~/services/notifications/NotificationService';
import type { NotificationsRepository } from '~/repositories/notifications';
import type { IStorageProvider } from '~/services/storage/IStorageProvider';
import {
  SendNotificationAttachmentRefSchema,
  PostSendActionSchema,
  type SendNotificationPayload,
  type NotificationMetadataStored,
  type SendNotificationAttachmentRef,
  type PostSendAction,
} from '@revendiste/shared';
import { logger } from '~/utils';

/**
 * Load attachments from storage using generic refs (storage path + optional filename).
 * Send-notification is attachment-agnostic: it only "loads a file and attaches it".
 */
async function resolveStorageAttachments(
  attachmentRefs: SendNotificationAttachmentRef[],
  storageProvider: IStorageProvider,
): Promise<Array<{ filename: string; content: Buffer; contentType: string }>> {
  const attachments: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }> = [];

  for (const ref of attachmentRefs) {
    if (ref.type !== 'storage') {
      logger.warn('Unsupported attachment ref type, skipping', {
        refType: (ref as { type: string }).type,
      });
      continue;
    }
    try {
      const buffer = await storageProvider.getBuffer(ref.storagePath);
      const filename =
        ref.filename ??
        ref.storagePath.split('/').pop() ??
        'attachment';
      attachments.push({
        filename,
        content: buffer,
        contentType: 'application/pdf', // default; could derive from path later
      });
    } catch (error) {
      logger.warn('Failed to load attachment from storage', {
        storagePath: ref.storagePath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return attachments;
}

export type PostSendActionRunners = Partial<{
  [K in PostSendAction['type']]: (
    action: Extract<PostSendAction, { type: K }>,
  ) => Promise<void>;
}>;

/**
 * Job handler for sending a notification through channels.
 * Attachment-agnostic: reads generic storage refs from metadata, loads files, attaches them.
 * After send, runs postSendActions (e.g. markInvoiceEmailSent) via injected runners.
 */
export function createSendNotificationHandler(
  notificationService: NotificationService,
  notificationsRepository: NotificationsRepository,
  storageProvider: IStorageProvider,
  postSendActionRunners: PostSendActionRunners,
): JobHandler {
  return async (payload: Record<string, unknown>) => {
    const data = payload as unknown as SendNotificationPayload;
    const notification = await notificationsRepository.getById(
      data.notificationId,
    );
    if (!notification) {
      logger.warn('Notification not found for send-notification job', {
        notificationId: data.notificationId,
      });
      return;
    }

    const meta = notification.metadata as
      | NotificationMetadataStored
      | null
      | undefined;
    const parsedRefs = meta?.attachmentRefs
      ? SendNotificationAttachmentRefSchema.array().safeParse(
          meta.attachmentRefs,
        )
      : { success: true as const, data: [] };
    const attachmentRefs = parsedRefs.success ? parsedRefs.data : [];

    const attachments = await resolveStorageAttachments(
      attachmentRefs,
      storageProvider,
    );
    await notificationService.sendNotification(
      data.notificationId,
      attachments,
    );

    const postSendActions = meta?.postSendActions ?? [];
    const parsedActions = PostSendActionSchema.array().safeParse(
      postSendActions,
    );
    const actions = parsedActions.success ? parsedActions.data : [];
    for (const action of actions) {
      const runner = postSendActionRunners[action.type];
      if (runner) {
        await runner(action);
      }
    }
  };
}
