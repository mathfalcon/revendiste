import express from 'express';
import {
  Route,
  Get,
  Post,
  Patch,
  Delete,
  Tags,
  Middlewares,
  Request,
  Response,
  Path,
  Queries,
} from '@mathfalcon/tsoa-runtime';
import {NotificationService} from '~/services/notifications/NotificationService';
import {
  requireAuthMiddleware,
  paginationMiddleware,
  ensurePagination,
  PaginationQuery,
} from '~/middleware';
import {db} from '~/db';
import {NotFoundError, UnauthorizedError} from '~/errors';
import {NOTIFICATION_ERROR_MESSAGES} from '~/constants/error-messages';
import type {TypedNotification} from '~/services/notifications/types';
import {
  UsersRepository,
  NotificationsRepository,
  NotificationBatchesRepository,
  PushSubscriptionsRepository,
} from '~/repositories';
import {getWebPushProvider} from '~/services/notifications/providers/WebPushProviderFactory';
import {NODE_ENV, APP_BASE_URL} from '~/config/env';
import {ValidateBody, Body} from '~/decorators';
import {
  SubscribePushRouteSchema,
  type SubscribePushRouteBody,
  UnsubscribePushRouteSchema,
  type UnsubscribePushRouteBody,
} from './validation';

interface GetNotificationsQuery extends PaginationQuery {
  includeSeen?: boolean;
}

type GetNotificationsResponse = Awaited<
  ReturnType<NotificationService['getUserNotifications']>
>;
type GetUnseenCountResponse = number;
type MarkAsSeenResponse = TypedNotification | null;
type MarkAllAsSeenResponse = TypedNotification[];
type DeleteNotificationResponse = TypedNotification | null;
type SubscribePushResponse = {success: boolean};
type UnsubscribePushResponse = {success: boolean};
type TestPushDevResponse = {sent: number; failed: number};
type TestInAppDevResponse = {notificationId: string};

@Route('notifications')
@Middlewares(requireAuthMiddleware)
@Tags('Notifications')
export class NotificationsController {
  private service = new NotificationService(
    new NotificationsRepository(db),
    new UsersRepository(db),
    new NotificationBatchesRepository(db),
  );
  private pushSubscriptionsRepository = new PushSubscriptionsRepository(db);

  @Get('/')
  @Middlewares(paginationMiddleware(10, 100), ensurePagination)
  @Response<UnauthorizedError>(401, 'Authentication required')
  public async getNotifications(
    @Queries() query: GetNotificationsQuery,
    @Request() request: express.Request,
  ): Promise<GetNotificationsResponse> {
    return this.service.getUserNotifications(request.user.id, {
      pagination: request.pagination!,
      includeSeen: query.includeSeen ?? true,
    });
  }

  @Get('/unseen-count')
  @Response<UnauthorizedError>(401, 'Authentication required')
  public async getUnseenCount(
    @Request() request: express.Request,
  ): Promise<GetUnseenCountResponse> {
    return this.service.getUnseenCount(request.user.id);
  }

  @Patch('/{notificationId}/seen')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<NotFoundError>(404, 'Notification not found')
  public async markAsSeen(
    @Path() notificationId: string,
    @Request() request: express.Request,
  ): Promise<MarkAsSeenResponse> {
    const notification = await this.service.markAsSeen(
      notificationId,
      request.user.id,
    );

    if (!notification) {
      throw new NotFoundError(
        NOTIFICATION_ERROR_MESSAGES.NOTIFICATION_NOT_FOUND,
      );
    }

    return notification;
  }

  @Patch('/seen-all')
  @Response<UnauthorizedError>(401, 'Authentication required')
  public async markAllAsSeen(
    @Request() request: express.Request,
  ): Promise<MarkAllAsSeenResponse> {
    return this.service.markAllAsSeen(request.user.id);
  }

  @Delete('/{notificationId}')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @Response<NotFoundError>(404, 'Notification not found')
  public async deleteNotification(
    @Path() notificationId: string,
    @Request() request: express.Request,
  ): Promise<DeleteNotificationResponse> {
    const notification = await this.service.deleteNotification(
      notificationId,
      request.user.id,
    );

    if (!notification) {
      throw new NotFoundError(
        NOTIFICATION_ERROR_MESSAGES.NOTIFICATION_NOT_FOUND,
      );
    }

    return notification;
  }

  @Post('/push-subscriptions')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @ValidateBody(SubscribePushRouteSchema)
  public async subscribePush(
    @Body() body: SubscribePushRouteBody,
    @Request() request: express.Request,
  ): Promise<SubscribePushResponse> {
    await this.pushSubscriptionsRepository.upsert({
      userId: request.user.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: body.userAgent,
    });
    return {success: true};
  }

  @Delete('/push-subscriptions')
  @Response<UnauthorizedError>(401, 'Authentication required')
  @ValidateBody(UnsubscribePushRouteSchema)
  public async unsubscribePush(
    @Body() body: UnsubscribePushRouteBody,
    @Request() request: express.Request,
  ): Promise<UnsubscribePushResponse> {
    await this.pushSubscriptionsRepository.deleteByUserIdAndEndpoint(
      request.user.id,
      body.endpoint,
    );
    return {success: true};
  }

  /**
   * DEV ONLY — Send a test push notification to all user's subscribed devices.
   * Removed before production deployment.
   */
  @Post('/test-push')
  @Response<UnauthorizedError>(401, 'Authentication required')
  public async testPush(
    @Request() request: express.Request,
  ): Promise<TestPushDevResponse> {
    if (NODE_ENV === 'production') {
      throw new UnauthorizedError('Not available in production');
    }

    const subs = await this.pushSubscriptionsRepository.getByUserId(
      request.user.id,
    );

    const provider = getWebPushProvider();
    const results = await Promise.allSettled(
      subs.map(sub =>
        provider.sendPush(
          {endpoint: sub.endpoint, keys: {p256dh: sub.p256dh, auth: sub.auth}},
          {
            title: 'Revendiste - Test',
            body: 'Si ves esto, las notificaciones push funcionan correctamente.',
            icon: '/android-chrome-192x192.png',
            url: '/',
            tag: 'test',
          },
        ),
      ),
    );

    const sent = results.filter(
      r => r.status === 'fulfilled' && r.value.success,
    ).length;
    return {sent, failed: subs.length - sent};
  }

  /**
   * DEV ONLY — Create a test in-app notification for the current user.
   * Goes through the full notification pipeline so it's picked up by polling.
   */
  @Post('/test-in-app')
  @Response<UnauthorizedError>(401, 'Authentication required')
  public async testInApp(
    @Request() request: express.Request,
  ): Promise<TestInAppDevResponse> {
    if (NODE_ENV === 'production') {
      throw new UnauthorizedError('Not available in production');
    }

    const notification = await this.service.createNotification({
      userId: request.user.id,
      type: 'ticket_sold_seller',
      channels: ['in_app'],
      metadata: {
        type: 'ticket_sold_seller',
        listingId: '00000000-0000-0000-0000-000000000000',
        eventName: 'Evento de prueba',
        eventStartDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        ticketCount: 2,
        platform: 'test',
        shouldPromptUpload: true,
      },
      actions: [
        {
          type: 'upload_documents',
          label: 'Subir documentos',
          url: `${APP_BASE_URL}/cuenta`,
        },
      ],
    });

    return {notificationId: notification.id};
  }
}
