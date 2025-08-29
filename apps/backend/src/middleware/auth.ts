import {clerkClient, getAuth} from '@clerk/express';
import {NextFunction, Request, Response} from 'express';
import {db} from '~/db';
import {UnauthorizedError} from '~/errors';
import {UsersRepository} from '~/repositories';
import {UsersService} from '~/services';

export const requireAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const {isAuthenticated, userId} = getAuth(req);

  if (!isAuthenticated) {
    throw new UnauthorizedError();
  }

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
  });

  req.user = user;

  return next();
};
