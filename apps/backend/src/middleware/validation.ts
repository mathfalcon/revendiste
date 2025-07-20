import {Request, Response, NextFunction} from 'express';
import {ZodType, ZodError, ZodObject} from 'zod';
import {ValidationError} from '~/errors';

// Validation schemas for different parts of the request
export type ValidationSchema = ZodObject<{
  query?: ZodType;
  body?: ZodType;
  params?: ZodType;
}>;

// Validation middleware factory
export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req);

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.issues
          .map(issue => `${issue.path.join('.')}: ${issue.message}`)
          .join(', ');

        next(new ValidationError(validationErrors));
      } else {
        next(error);
      }
    }
  };
};
