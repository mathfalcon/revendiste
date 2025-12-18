import express from 'express';
import {
  Route,
  Get,
  Patch,
  Delete,
  Tags,
  Middlewares,
  Request,
  Response,
  Path,
  Queries,
} from '@mathfalcon/tsoa';
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
import type {PaginatedResponse} from '~/types';
import {UsersRepository} from '~/repositories';

interface GetNotificationsQuery extends PaginationQuery {
  includeSeen?: boolean;
}

type GetNotificationsResponse = PaginatedResponse<TypedNotification>;
type GetUnseenCountResponse = number;
type MarkAsSeenResponse = TypedNotification | null;
type MarkAllAsSeenResponse = TypedNotification[];
type DeleteNotificationResponse = TypedNotification | null;

@Route('notifications')
@Middlewares(requireAuthMiddleware)
@Tags('Notifications')
export class NotificationsController {
  private service = new NotificationService(db, new UsersRepository(db));

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
}
