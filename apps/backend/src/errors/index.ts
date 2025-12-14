export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

// 4xx Client Errors
export class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409)
  }
}

export class ValidationError extends AppError {
  public readonly metadata?: Record<string, any>;

  constructor(message = 'Validation Error', metadata?: Record<string, any>) {
    super(message, 422)
    this.metadata = metadata
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too Many Requests') {
    super(message, 429)
  }
}

// 5xx Server Errors
export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 500, false)
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service Unavailable') {
    super(message, 503, false)
  }
}

// Database Errors
export class DatabaseError extends AppError {
  constructor(message = 'Database Error') {
    super(message, 500, false)
  }
}

// Zod Validation Error
export class ZodValidationError extends AppError {
  constructor(message = 'Validation Error') {
    super(message, 422)
  }
} 