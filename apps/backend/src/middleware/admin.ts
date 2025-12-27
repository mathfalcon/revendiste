import {NextFunction, Request, Response} from 'express';
import {UnauthorizedError} from '~/errors';
import {ADMIN_ERROR_MESSAGES} from '~/constants/error-messages';

/**
 * Middleware that requires the user to be an admin
 * Must be used after requireAuthMiddleware
 */
export const requireAdminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    throw new UnauthorizedError();
  }

  if (req.user.role !== 'admin') {
    throw new UnauthorizedError(ADMIN_ERROR_MESSAGES.ADMIN_ONLY);
  }

  return next();
};

