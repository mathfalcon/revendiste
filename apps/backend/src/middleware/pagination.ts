import {Request, Response, NextFunction} from 'express';
import {PaginatedResponse, PaginationOptions} from '~/types/pagination';
import {validateRequest} from './validation';
import z from 'zod';

export const PaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => parseInt(val || '1')),
  limit: z
    .string()
    .optional()
    .transform(val => parseInt(val || '10')),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type PaginationQuery = z.infer<typeof PaginationSchema>;

const validatePagination = () =>
  validateRequest(
    z.object({
      query: PaginationSchema,
    }),
  );

export const paginationMiddleware = (defaultLimit = 10, maxLimit = 100) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // First validate the query parameters
    validatePagination()(req, res, err => {
      if (err) {
        return next(err);
      }

      // Now process the validated query parameters
      const query = req.query as any;

      // Parse and validate page
      const page = Math.max(1, query.page || 1);

      // Parse and validate limit
      const limit = Math.min(
        maxLimit,
        Math.max(1, query.limit || defaultLimit),
      );

      // Parse sort parameters
      const sortBy = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

      // Calculate offset
      const offset = (page - 1) * limit;

      // Add pagination options to request
      req.pagination = {
        page,
        limit,
        offset,
        sortBy,
        sortOrder,
      };

      next();
    });
  };
};

// Helper function to create paginated response
export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  options: PaginationOptions,
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total / options.limit);
  const hasNext = options.page < totalPages;
  const hasPrev = options.page > 1;

  return {
    data,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
};

export const ensurePagination = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.pagination) {
    throw new Error(
      `Pagination middleware (paginationMiddleware) must be applied to this route: ${req.path}`,
    );
  }
  next();
};
