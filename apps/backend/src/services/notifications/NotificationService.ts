import {PaginatedResponse} from '~/types';
import {logger} from '~/utils';
import {
  NotificationsRepository,
  UsersRepository,
  NotificationBatchesRepository,
} from '~/repositories';
import type {IEmailProvider} from './providers/IEmailProvider';
import {getEmailProvider} from './providers/EmailProviderFactory';
import {EMAIL_FROM} from '~/config/env';
import {CreateNotificationData} from '~/repositories/notifications';
import {
  parseNotification,
  type TypedNotification,
  validateNotification,
} from './types';
import type {NotificationType, NotificationMetadata} from '@revendiste/shared';
import {
  NotificationMetadataSchema,
  NotificationActionsSchema,
  type NotificationAction,
} from '@revendiste/shared';
import {WithPagination} from '~/types';
import {ValidationError} from '~/errors';
import {
  parseNotificationMetadata,
  buildEmailTemplate,
} from './email-template-builder';
import {generateNotificationText} from '@revendiste/shared';
import {getJobQueueService} from '~/services/job-queue';
import type {
  PostSendAction,
  SendNotificationAttachmentRef,
} from '@revendiste/shared';

export interface EmailAttachmentParam {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface CreateNotificationParams extends CreateNotificationData {
  /** When true, enqueue send-notification job (cronjob sends later). When false/undefined, send immediately (fire-and-forget). Use job for heavy/attachments, immediate for low-latency. */
  deferSendToJob?: boolean;
  /** In-memory attachments; used when deferSendToJob is false/undefined (immediate send) */
  attachments?: EmailAttachmentParam[];
  /** Refs for the send-notification job to load attachments from storage (generic: path + filename); used when deferSendToJob is true */
  attachmentRefs?: SendNotificationAttachmentRef[];
  /** Actions to run after the notification is sent (e.g. mark invoice email sent); used when deferSendToJob is true */
  postSendActions?: PostSendAction[];
}

export interface DebounceConfig {
  /** Unique key to group related notifications (e.g., `document_uploaded:${orderId}`) */
  key: string;
  /** Time window in milliseconds to wait before processing the batch */
  windowMs: number;
}

export interface CreateDebouncedNotificationParams
  extends CreateNotificationParams {
  /** Debounce configuration for batching notifications */
  debounce: DebounceConfig;
}

/** Merger function type for combining batch items into final notification metadata */
export type MetadataMerger = (
  items: Array<{metadata: NotificationMetadata; actions?: unknown}>,
  batchInfo: {notificationType: NotificationType},
) => {
  metadata: NotificationMetadata;
  actions: NotificationAction[] | null;
};

export class NotificationService {
  private emailProvider: IEmailProvider;

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly notificationBatchesRepository?: NotificationBatchesRepository,
    emailProvider?: IEmailProvider,
  ) {
    // Use provided provider or get from factory based on configuration
    this.emailProvider = emailProvider || getEmailProvider();
  }

  /**
   * Create a notification and send it through configured channels
   * Validates the notification data before creating it
   */
  async createNotification(params: CreateNotificationParams) {
    // Validate metadata if provided
    let validatedMetadata = params.metadata;
    if (params.metadata) {
      try {
        validatedMetadata = NotificationMetadataSchema.parse(params.metadata);
        // Ensure metadata type matches notification type
        if (validatedMetadata.type !== params.type) {
          throw new ValidationError(
            `Metadata type ${validatedMetadata.type} does not match notification type ${params.type}`,
          );
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }
        throw new ValidationError(
          `Invalid notification metadata: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    // Validate actions if provided
    let validatedActions:
      | Array<{
          type: string;
          label: string;
          url?: string;
          data?: Record<string, unknown>;
        }>
      | null
      | undefined = params.actions;
    if (params.actions !== undefined && params.actions !== null) {
      try {
        const parsed = NotificationActionsSchema.parse(params.actions);
        validatedActions = parsed || null;
      } catch (error) {
        throw new ValidationError(
          `Invalid notification actions: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    } else if (params.actions === null) {
      validatedActions = null;
    }

    // Metadata is required to generate title/description
    if (!validatedMetadata) {
      throw new ValidationError(
        'Notification metadata is required to generate title and description',
      );
    }

    // Generate title and description from metadata for validation
    const {title, description} = generateNotificationText(
      params.type,
      validatedMetadata,
    );

    // Validate full notification structure using type-specific schema
    const actionsForValidation = validatedActions ?? null;
    try {
      const fullNotification = {
        userId: params.userId,
        type: params.type,
        title,
        description,
        channels: params.channels,
        actions: actionsForValidation,
        metadata: validatedMetadata,
        status: 'pending' as const,
        seenAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      // Validate against the discriminated union schema
      validateNotification(fullNotification);
    } catch (error) {
      throw new ValidationError(
        `Invalid notification structure: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    // Store attachmentRefs and postSendActions in metadata when deferring to job (job payload stays only notificationId)
    const metadataToStore =
      params.deferSendToJob === true &&
      (params.attachmentRefs?.length || params.postSendActions?.length)
        ? {
            ...validatedMetadata,
            ...(params.attachmentRefs?.length && {
              attachmentRefs: params.attachmentRefs,
            }),
            ...(params.postSendActions?.length && {
              postSendActions: params.postSendActions,
            }),
          }
        : validatedMetadata;

    // Create notification record (repository assumes data is already validated)
    const notification = await this.notificationsRepository.create({
      userId: params.userId,
      type: params.type,
      channels: params.channels,
      actions: actionsForValidation,
      metadata: metadataToStore,
      sendViaJob: params.deferSendToJob === true,
    });

    if (params.deferSendToJob === true) {
      // Delegate sending to the cronjob; attachments are read from notification.metadata.attachmentRefs
      const jobQueue = getJobQueueService();
      await jobQueue.enqueue(
        'send-notification',
        {notificationId: notification.id},
        `send-notification:${notification.id}`,
      );
    } else {
      // Send immediately (fire-and-forget) for low-latency notifications
      this.sendNotification(notification.id, params.attachments).catch(
        async error => {
          logger.error('Failed to send notification', {
            notificationId: notification.id,
            error: error.message,
          });
          await this.notificationsRepository.updateStatus(
            notification.id,
            'failed',
          );
        },
      );
    }

    return notification;
  }

  /**
   * Send notification through all configured channels
   * Tracks per-channel delivery status
   * This is called asynchronously after notification creation
   */
  public async sendNotification(
    notificationId: string,
    attachments?: EmailAttachmentParam[],
  ) {
    const notification = await this.notificationsRepository.getById(
      notificationId,
    );
    if (!notification) {
      logger.error('Notification not found', {notificationId});
      return;
    }

    // Check if notification should be skipped (already processed)
    if (await this.shouldSkipNotification(notification, notificationId)) {
      return;
    }

    // Get user email and handle not found case
    const userEmail = await this.getUserEmailForNotification(
      notification,
      notificationId,
    );
    if (!userEmail) {
      return; // Error already logged and status updated
    }

    // Send through all channels
    const channelStatus = await this.sendThroughChannels(
      notification,
      userEmail,
      attachments,
    );

    // Update channel status in database
    await this.notificationsRepository.updateChannelStatus(
      notificationId,
      channelStatus,
    );

    // Update overall notification status based on channel results
    await this.updateNotificationStatusFromChannels(
      notificationId,
      channelStatus,
    );
  }

  /**
   * Check if notification should be skipped (already sent/failed or all channels processed)
   */
  private async shouldSkipNotification(
    notification: NonNullable<
      Awaited<ReturnType<NotificationsRepository['getById']>>
    >,
    notificationId: string,
  ): Promise<boolean> {
    const status = notification.status;

    // Skip if notification has already been sent or failed
    if (status === 'sent' || status === 'failed') {
      logger.debug('Notification already processed', {
        notificationId,
        status,
      });
      return true;
    }

    // Check if all channels have already been sent
    // This handles cases where notification status might still be 'pending'
    // but all channels have been successfully sent
    if (notification.channelStatus) {
      const channelStatus = notification.channelStatus as Record<
        string,
        {status: 'sent' | 'failed'}
      >;
      const allChannelsProcessed = notification.channels.every(
        channel =>
          channelStatus[channel]?.status === 'sent' ||
          channelStatus[channel]?.status === 'failed',
      );

      if (allChannelsProcessed) {
        logger.debug('All channels already processed for notification', {
          notificationId,
          channelStatus,
        });
        // Update status to 'sent' if all channels succeeded
        const allSent = notification.channels.every(
          channel => channelStatus[channel]?.status === 'sent',
        );
        if (allSent) {
          await this.notificationsRepository.updateStatus(
            notificationId,
            'sent',
          );
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Get user email for notification, handle not found case
   * Returns null if user not found (error already logged and status updated)
   */
  private async getUserEmailForNotification(
    notification: NonNullable<
      Awaited<ReturnType<NotificationsRepository['getById']>>
    >,
    notificationId: string,
  ): Promise<string | null> {
    const user = await this.usersRepository.getById(notification.userId);

    if (!user || !user.email) {
      logger.error('User not found or has no email for notification', {
        notificationId,
        userId: notification.userId,
      });

      // Mark all channels as failed
      const channelStatus: Record<string, {status: 'failed'; error: string}> =
        {};
      for (const channel of notification.channels) {
        channelStatus[channel] = {
          status: 'failed',
          error: 'User not found or has no email',
        };
      }
      await this.notificationsRepository.updateChannelStatus(
        notificationId,
        channelStatus,
      );
      await this.notificationsRepository.updateStatus(notificationId, 'failed');
      return null;
    }

    return user.email;
  }

  /**
   * Send notification through all configured channels
   * Returns channel status for each channel
   */
  private async sendThroughChannels(
    notification: NonNullable<
      Awaited<ReturnType<NotificationsRepository['getById']>>
    >,
    userEmail: string,
    attachments?: EmailAttachmentParam[],
  ): Promise<
    Record<string, {status: 'sent' | 'failed'; sentAt?: string; error?: string}>
  > {
    const channelStatus: Record<
      string,
      {status: 'sent' | 'failed'; sentAt?: string; error?: string}
    > = {};

    // Send through each channel and track status individually
    await Promise.allSettled(
      notification.channels.map(async channel => {
        try {
          if (channel === 'email') {
            await this.sendEmailNotification(
              notification,
              userEmail,
              attachments,
            );
            channelStatus[channel] = {
              status: 'sent',
              sentAt: new Date().toISOString(),
            };
          } else if (channel === 'in_app') {
            // In-app notifications are automatically "sent" when created
            channelStatus[channel] = {
              status: 'sent',
              sentAt: new Date().toISOString(),
            };
          }
          // Future: Add SMS, push notifications, etc.
        } catch (error) {
          channelStatus[channel] = {
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
          };
          throw error; // Re-throw to mark Promise as rejected
        }
      }),
    );

    return channelStatus;
  }

  /**
   * Update overall notification status based on channel results
   */
  private async updateNotificationStatusFromChannels(
    notificationId: string,
    channelStatus: Record<
      string,
      {status: 'sent' | 'failed'; sentAt?: string; error?: string}
    >,
  ): Promise<void> {
    const allChannelsSent = Object.values(channelStatus).every(
      status => status.status === 'sent',
    );
    const allChannelsFailed = Object.values(channelStatus).every(
      status => status.status === 'failed',
    );

    if (allChannelsSent) {
      await this.notificationsRepository.updateStatus(notificationId, 'sent');
    } else if (allChannelsFailed) {
      // Increment retry count for failed notifications
      await this.notificationsRepository.incrementRetryCount(notificationId);
      await this.notificationsRepository.updateStatus(notificationId, 'failed');
    } else {
      // Partial success - some channels sent, some failed
      // Mark as sent (partial success is still success)
      await this.notificationsRepository.updateStatus(notificationId, 'sent');
      logger.warn('Partial notification delivery', {
        notificationId,
        channelStatus,
      });
    }
  }

  /**
   * Send email notification using React Email templates
   * Renders React components to HTML in the transactional package (no React in backend)
   */
  private async sendEmailNotification(
    notification: {
      type: string;
      actions?: unknown;
      metadata?: unknown;
    },
    userEmail: string,
    attachments?: EmailAttachmentParam[],
  ) {
    const notificationType = notification.type as NotificationType;

    // Parse metadata using the correct schema based on notification type
    const parsedMetadata = parseNotificationMetadata(
      notificationType,
      notification.metadata,
    );

    if (!parsedMetadata) {
      logger.error('Notification metadata is required for email', {
        notificationType,
        userId: notification.type,
      });
      throw new Error(
        `Notification metadata is required for email type: ${notificationType}`,
      );
    }

    // Generate title from metadata for email subject
    const {title} = generateNotificationText(notificationType, parsedMetadata);

    // Parse actions (Kysely automatically parses JSONB, but we need to type it)
    const actions = notification.actions
      ? (notification.actions as NotificationAction[])
      : null;

    // Build email template from typed metadata
    const {html, text} = await buildEmailTemplate(
      notificationType,
      parsedMetadata,
      actions,
    );

    await this.emailProvider.sendEmail({
      to: userEmail,
      subject: title,
      html,
      text,
      from: EMAIL_FROM,
      attachments,
    });
  }

  /**
   * Get notifications for a user (paginated)
   */
  async getUserNotifications(
    userId: string,
    args: WithPagination<{
      includeSeen?: boolean;
    }>,
  ): Promise<PaginatedResponse<TypedNotification>> {
    const result = await this.notificationsRepository.getByUserIdPaginated(
      userId,
      args.pagination,
      {
        includeSeen: args.includeSeen,
      },
    );

    return {
      ...result,
      data: result.data.map(parseNotification),
    };
  }

  /**
   * Get unseen notification count for a user
   */
  async getUnseenCount(userId: string) {
    return await this.notificationsRepository.getUnseenCount(userId);
  }

  /**
   * Mark notification as seen
   */
  async markAsSeen(
    notificationId: string,
    userId: string,
  ): Promise<TypedNotification | null> {
    const notification = await this.notificationsRepository.markAsSeen(
      notificationId,
      userId,
    );
    return notification ? parseNotification(notification) : null;
  }

  /**
   * Mark all notifications as seen for a user
   */
  async markAllAsSeen(userId: string): Promise<TypedNotification[]> {
    const notifications = await this.notificationsRepository.markAllAsSeen(
      userId,
    );
    return notifications.map(parseNotification);
  }

  /**
   * Delete a notification
   */
  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<TypedNotification | null> {
    const notification = await this.notificationsRepository.delete(
      notificationId,
      userId,
    );
    return notification ? parseNotification(notification) : null;
  }

  /**
   * Process pending notifications (retry): for each pending notification, either enqueue
   * send-notification job (when sendViaJob is true) or send directly (when sendViaJob is false).
   * Called by cron to retry failed or never-delivered notifications.
   */
  async processPendingNotifications(limit: number = 100) {
    const pending = await this.notificationsRepository.getPendingNotifications(
      limit,
    );

    const jobQueue = getJobQueueService();

    const BATCH_SIZE = 10;
    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      const batch = pending.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(async notification => {
          try {
            if (notification.sendViaJob) {
              await jobQueue.enqueue(
                'send-notification',
                {notificationId: notification.id},
                `send-notification:${notification.id}`,
              );
            } else {
              await this.sendNotification(notification.id);
            }
          } catch (error) {
            logger.error('Failed to process pending notification', {
              notificationId: notification.id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }),
      );
    }

    return pending.length;
  }

  // ==========================================================================
  // Debounced Notification Methods
  // ==========================================================================

  /**
   * Create a debounced notification that will be batched with similar notifications
   * within the specified time window.
   *
   * Instead of sending immediately, the notification is added to a batch.
   * When the batch window expires, all items are merged into a single notification.
   *
   * @param params - Notification params with debounce configuration
   * @returns The batch info (not the final notification, which is created later)
   */
  async createDebouncedNotification(params: CreateDebouncedNotificationParams) {
    if (!this.notificationBatchesRepository) {
      throw new Error(
        'NotificationBatchesRepository is required for debounced notifications',
      );
    }

    const {debounce, ...notificationParams} = params;

    // Validate metadata
    let validatedMetadata = notificationParams.metadata;
    if (notificationParams.metadata) {
      try {
        validatedMetadata = NotificationMetadataSchema.parse(
          notificationParams.metadata,
        );
      } catch (error) {
        throw new ValidationError(
          `Invalid notification metadata: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    if (!validatedMetadata) {
      throw new ValidationError(
        'Notification metadata is required for debounced notifications',
      );
    }

    // Check if there's an existing pending batch for this key
    const existingBatch =
      await this.notificationBatchesRepository.findPendingBatchByKey(
        debounce.key,
        notificationParams.userId,
      );

    if (existingBatch) {
      // Add item to existing batch
      const item = await this.notificationBatchesRepository.addItemToBatch({
        batchId: existingBatch.id,
        metadata: validatedMetadata,
        actions: notificationParams.actions,
      });

      logger.info('Added item to existing notification batch', {
        batchId: existingBatch.id,
        itemId: item.id,
        debounceKey: debounce.key,
      });

      return {
        batchId: existingBatch.id,
        itemId: item.id,
        isNewBatch: false,
      };
    }

    // Create new batch
    const windowEndsAt = new Date(Date.now() + debounce.windowMs);
    const batch = await this.notificationBatchesRepository.createBatch({
      debounceKey: debounce.key,
      userId: notificationParams.userId,
      notificationType: notificationParams.type,
      channels: notificationParams.channels,
      windowEndsAt,
    });

    // Add first item to the batch
    const item = await this.notificationBatchesRepository.addItemToBatch({
      batchId: batch.id,
      metadata: validatedMetadata,
      actions: notificationParams.actions,
    });

    logger.info('Created new notification batch', {
      batchId: batch.id,
      itemId: item.id,
      debounceKey: debounce.key,
      windowEndsAt: windowEndsAt.toISOString(),
    });

    return {
      batchId: batch.id,
      itemId: item.id,
      isNewBatch: true,
    };
  }

  /**
   * Process pending notification batches (for background job)
   * Finds batches where the window has ended and merges them into final notifications
   *
   * @param limit - Maximum number of batches to process
   * @returns Number of batches processed
   */
  async processPendingBatches(limit: number = 100): Promise<number> {
    if (!this.notificationBatchesRepository) {
      logger.warn(
        'NotificationBatchesRepository not configured, skipping batch processing',
      );
      return 0;
    }

    const pendingBatches =
      await this.notificationBatchesRepository.getBatchesReadyToProcess(limit);

    if (pendingBatches.length === 0) {
      return 0;
    }

    logger.info('Processing pending notification batches', {
      count: pendingBatches.length,
    });

    // Process batches in parallel (with limit)
    const BATCH_SIZE = 10;
    let processedCount = 0;

    for (let i = 0; i < pendingBatches.length; i += BATCH_SIZE) {
      const batchSlice = pendingBatches.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batchSlice.map(async batch => {
          try {
            await this.processSingleBatch(batch.id);
            processedCount++;
          } catch (error) {
            logger.error('Failed to process notification batch', {
              batchId: batch.id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }),
      );

      // Log any failures
      results.forEach((result, idx) => {
        if (result.status === 'rejected') {
          logger.error('Batch processing promise rejected', {
            batchId: batchSlice[idx].id,
            reason: result.reason,
          });
        }
      });
    }

    return processedCount;
  }

  /**
   * Process a single notification batch
   * Merges all items and creates the final notification
   */
  private async processSingleBatch(batchId: string): Promise<void> {
    if (!this.notificationBatchesRepository) {
      throw new Error('NotificationBatchesRepository is required');
    }

    const batchWithItems =
      await this.notificationBatchesRepository.getBatchWithItems(batchId);

    if (!batchWithItems) {
      logger.error('Batch not found', {batchId});
      return;
    }

    if (batchWithItems.items.length === 0) {
      logger.warn('Batch has no items, cancelling', {batchId});
      await this.notificationBatchesRepository.cancelBatch(batchId);
      return;
    }

    // Get the merger for this notification type
    const merger = this.getMetadataMerger(batchWithItems.notificationType);

    // Merge items into final notification data
    const items = batchWithItems.items.map(item => ({
      metadata: item.metadata as NotificationMetadata,
      actions: item.actions,
    }));

    const {metadata: mergedMetadata, actions: mergedActions} = merger(items, {
      notificationType: batchWithItems.notificationType,
    });

    // Create the final notification
    const notification = await this.createNotification({
      userId: batchWithItems.userId,
      type: mergedMetadata.type as NotificationType,
      channels: batchWithItems.channels,
      metadata: mergedMetadata,
      actions: mergedActions,
    });

    // Mark batch as processed
    await this.notificationBatchesRepository.markBatchProcessed(
      batchId,
      notification.id,
    );

    logger.info('Notification batch processed successfully', {
      batchId,
      finalNotificationId: notification.id,
      itemCount: batchWithItems.items.length,
    });
  }

  /**
   * Get the metadata merger function for a notification type
   * Each notification type can have its own merge strategy
   */
  private getMetadataMerger(notificationType: NotificationType): MetadataMerger {
    switch (notificationType) {
      case 'document_uploaded':
        return this.mergeDocumentUploadedItems.bind(this);
      default:
        // Default merger: use the last item's metadata (simple replace strategy)
        return items => {
          const lastItem = items[items.length - 1];
          const actions =
            (lastItem.actions as NotificationAction[] | null | undefined) ??
            null;
          return {
            metadata: lastItem.metadata,
            actions,
          };
        };
    }
  }

  /**
   * Merge document_uploaded items into a document_uploaded_batch notification
   */
  private mergeDocumentUploadedItems(
    items: Array<{metadata: NotificationMetadata; actions?: unknown}>,
  ): {
    metadata: NotificationMetadata;
    actions: NotificationAction[] | null;
  } {
    // Extract data from items (assuming document_uploaded metadata structure)
    const firstItem = items[0].metadata as {
      type: 'document_uploaded';
      orderId: string;
      eventName: string;
      ticketCount: number;
    };

    // For document_uploaded_batch, we aggregate the ticket info
    const mergedMetadata = {
      type: 'document_uploaded_batch' as const,
      orderId: firstItem.orderId,
      eventName: firstItem.eventName,
      uploadedCount: items.length,
      // Each item represents one ticket upload
      tickets: items.map((item, index) => {
        const meta = item.metadata as {
          type: 'document_uploaded';
          orderId: string;
          eventName: string;
          ticketCount: number;
        };
        return {
          ticketNumber: String(index + 1), // We don't have individual ticket numbers, use index
          eventName: meta.eventName,
        };
      }),
    };

    // Use actions from the first item (they should all point to the same order)
    const actions = items[0].actions as NotificationAction[] | null;

    return {
      metadata: mergedMetadata as unknown as NotificationMetadata,
      actions,
    };
  }
}
