import {clerkClient, getAuth} from '@clerk/express';
import {NextFunction, Request, Response} from 'express';
import {db} from '~/db';
import {UnauthorizedError} from '~/errors';
import {UsersRepository} from '~/repositories';
import {UsersService} from '~/services';
import {logger} from '~/utils';

// Global middleware that populates req.user when available (optional auth)
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const {isAuthenticated, userId} = getAuth(req);

  logger.error('optionalAuthMiddleware');
  logger.error(isAuthenticated);
  logger.error(userId);
  logger.error(req.headers);
  logger.error(req.body);

  if (isAuthenticated && userId) {
    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      const usersService = new UsersService(new UsersRepository(db));

      const user = await usersService.getOrCreateUser({
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress!.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        lastActiveAt: clerkUser.lastActiveAt
          ? new Date(clerkUser.lastActiveAt)
          : null,
        metadata: {},
        role: 'user',
      });

      req.user = user;
    } catch (error) {
      // If there's an error getting user info, just continue without authentication
      logger.warn('Failed to populate user from auth:', error);
      logger.error(error);
    }
  }

  return next();
};

export const requireAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    logger.error('User not authenticated');
    throw new UnauthorizedError();
  }

  return next();
};
