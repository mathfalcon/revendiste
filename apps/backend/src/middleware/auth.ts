import {clerkClient, getAuth} from '@clerk/express';
import {NextFunction, Request, Response} from 'express';
import {db} from '~/db';
import {UnauthorizedError} from '~/errors';
import {UsersRepository} from '~/repositories';
import {UsersService} from '~/services';
import {logger} from '~/utils';
const defaultUsersService = new UsersService(new UsersRepository(db));

/**
 * Creates optional auth middleware. In tests, pass a mock UsersService to avoid Clerk.
 * When not provided, uses the default UsersService (Clerk + DB).
 */
export function createOptionalAuthMiddleware(
  usersService?: UsersService,
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const service = usersService ?? defaultUsersService;

  return async (req: Request, res: Response, next: NextFunction) => {
    const {isAuthenticated, userId} = getAuth(req);

    if (isAuthenticated && userId) {
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        const user = await service.getOrCreateUser({
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
        logger.warn('Failed to populate user from auth', {error});
      }
    }

    return next();
  };
}

/** Global middleware that populates req.user when available (optional auth). */
export const optionalAuthMiddleware = createOptionalAuthMiddleware();

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
