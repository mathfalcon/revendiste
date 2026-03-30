export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Union type of all error class names that can be returned by the API.
 * Used for type-safe error handling on the frontend.
 */
export type ErrorClassName =
  | 'AppError'
  | 'BadRequestError'
  | 'UnauthorizedError'
  | 'ForbiddenError'
  | 'NotFoundError'
  | 'ConflictError'
  | 'ValidationError'
  | 'TooManyRequestsError'
  | 'MaxAttemptsExceededError'
  | 'InternalServerError'
  | 'ServiceUnavailableError'
  | 'DatabaseError'
  | 'ZodValidationError';

/**
 * API Error Response - This is the actual shape returned by the error handler middleware.
 * Use this type in @Response decorators instead of error class types.
 */
export interface ApiErrorResponse {
  /** The error class name (e.g., 'ValidationError', 'UnauthorizedError') */
  error: ErrorClassName;
  /** Human-readable error message */
  message: string;
  /** HTTP status code */
  statusCode: number;
  /** ISO timestamp of when the error occurred */
  timestamp: string;
  /** Request path that caused the error */
  path: string;
  /** HTTP method of the request */
  method: string;
  /** Additional metadata (e.g., for validation errors) */
  metadata?: Record<string, unknown>;
}

// 4xx Client Errors
export class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  public readonly metadata?: Record<string, any>;

  constructor(message = 'Conflict', metadata?: Record<string, any>) {
    super(message, 409);
    this.metadata = metadata;
  }
}

export class ValidationError extends AppError {
  public readonly metadata?: Record<string, any>;

  constructor(message = 'Validation Error', metadata?: Record<string, any>) {
    super(message, 422);
    this.metadata = metadata;
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too Many Requests') {
    super(message, 429);
  }
}

// Identity Verification Errors
export class MaxAttemptsExceededError extends AppError {
  constructor(message = 'Maximum attempts exceeded') {
    super(message, 429);
  }
}

// 5xx Server Errors
export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 500, false);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service Unavailable') {
    super(message, 503, false);
  }
}

// Database Errors
export class DatabaseError extends AppError {
  constructor(message = 'Database Error') {
    super(message, 500, false);
  }
}

// Zod Validation Error
export class ZodValidationError extends AppError {
  constructor(message = 'Validation Error') {
    super(message, 422);
  }
}
