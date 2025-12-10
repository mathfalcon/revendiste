import {Kysely} from 'kysely';
import {DB} from '~/shared';
import {PaginatedResponse} from '~/types';
import {logger} from '~/utils';
import {NotificationsRepository, UsersRepository} from '~/repositories';
import type {IEmailProvider} from './providers/IEmailProvider';
import {getEmailProvider} from './providers/EmailProviderFactory';
import {EMAIL_FROM} from '~/config/env';
import {CreateNotificationData} from '~/repositories/notifications';
import {
  parseNotification,
  type TypedNotification,
  validateNotification,
} from './types';
import type {NotificationType} from '~/shared';
import {
  NotificationMetadataSchema,
  NotificationActionsSchema,
  type NotificationAction,
} from '~/shared';
import {WithPagination} from '~/types';
import {ValidationError} from '~/errors';
import {
  parseNotificationMetadata,
  buildEmailTemplate,
} from './email-template-builder';

export interface CreateNotificationParams extends CreateNotificationData {
  // Additional params can be added here
}

export class NotificationService {
  private notificationsRepository: NotificationsRepository;
  private usersRepository: UsersRepository;
  private emailProvider: IEmailProvider;

  constructor(
    db: Kysely<DB>,
    usersRepository: UsersRepository,
    emailProvider?: IEmailProvider,
  ) {
    this.notificationsRepository = new NotificationsRepository(db);
    this.usersRepository = usersRepository;
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
      | undefined = params.actions;
    if (params.actions) {
      try {
        const parsed = NotificationActionsSchema.parse(params.actions);
        validatedActions = parsed || undefined; // Convert null to undefined
      } catch (error) {
        throw new ValidationError(
          `Invalid notification actions: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    // Validate full notification structure using type-specific schema
    try {
      const fullNotification = {
        userId: params.userId,
        type: params.type,
        title: params.title,
        description: params.description,
        channels: params.channels,
        actions: validatedActions,
        metadata: validatedMetadata,
        status: 'pending' as const,
        seenAt: null,
        sentAt: null,
        failedAt: null,
        errorMessage: null,
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

    // Create notification record (repository assumes data is already validated)
    const notification = await this.notificationsRepository.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      description: params.description,
      channels: params.channels,
      actions: validatedActions,
      metadata: validatedMetadata,
    });

    // Send through configured channels (fire-and-forget)
    this.sendNotification(notification.id).catch(error => {
      logger.error('Failed to send notification', {
        notificationId: notification.id,
        error: error.message,
      });
    });

    return notification;
  }

  /**
   * Send notification through all configured channels
   * Tracks per-channel delivery status
   * This is called asynchronously after notification creation
   */
  public async sendNotification(notificationId: string) {
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
      await this.notificationsRepository.updateStatus(
        notificationId,
        'failed',
        'User not found or has no email',
      );
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
            await this.sendEmailNotification(notification, userEmail);
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
      const errorMessages = Object.entries(channelStatus)
        .filter(([_, status]) => status.status === 'failed')
        .map(([channel, status]) => `${channel}: ${status.error}`)
        .join('; ');
      await this.notificationsRepository.updateStatus(
        notificationId,
        'failed',
        errorMessages,
      );
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
      title: string;
      description: string;
      actions?: unknown;
      metadata?: unknown;
    },
    userEmail: string,
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
      subject: notification.title,
      html,
      text,
      from: EMAIL_FROM,
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
   * Process pending notifications (for background job)
   * Processes in parallel batches for better performance
   * This can be called by a cron job to retry failed notifications
   */
  async processPendingNotifications(limit: number = 100) {
    const pending = await this.notificationsRepository.getPendingNotifications(
      limit,
    );

    // Process in parallel batches to improve throughput
    const BATCH_SIZE = 10;
    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      const batch = pending.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(async notification => {
          try {
            await this.sendNotification(notification.id);
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
}
