import {Request, Response, NextFunction} from 'express';
import {ZodError} from 'zod';
import {
  AppError,
  ZodValidationError,
  InternalServerError,
  ValidationError,
} from '~/errors';
import {ValidateError} from '@tsoa/runtime';
import {logger} from '~/utils';

interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  stack?: string;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let error = err;

  if (err instanceof ValidateError) {
    return res.status(422).json({
      message: 'Validation Failed',
      details: err?.fields,
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationErrors = err.issues
      .map((e: any) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    error = new ZodValidationError(validationErrors);
  }

  // Handle custom AppError instances
  if (error instanceof AppError) {
    const errorResponse: ErrorResponse & {metadata?: Record<string, any>} = {
      error: error.constructor.name,
      message: error.message,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    };

    // Include metadata if available (e.g., orderId for duplicate order errors)
    if (error instanceof ValidationError && error.metadata) {
      errorResponse.metadata = error.metadata;
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
    }

    return res.status(error.statusCode).json(errorResponse);
  }

  // Handle database errors
  if (
    error.name === 'QueryFailedError' ||
    error.name === 'EntityNotFoundError'
  ) {
    error = new InternalServerError('Database operation failed');
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  }

  if (error.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  }

  // Handle unknown errors
  const isOperational = error instanceof AppError && error.isOperational;
  if (!isOperational) {
    logger.error('Non-operational error:', error);
    error = new InternalServerError();
  }

  const errorResponse: ErrorResponse = {
    error: error.constructor.name,
    message: error.message,
    statusCode: error instanceof AppError ? error.statusCode : 500,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  return res.status(errorResponse.statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
