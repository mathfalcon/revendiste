import {Request, Response, NextFunction} from 'express';
import {randomUUID} from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * Sets X-Request-Id on the request (from header or generated) and response.
 * Enables correlation of logs and error reports; include in error response for support.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const id =
    (req.headers['x-request-id'] as string)?.trim() || randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
