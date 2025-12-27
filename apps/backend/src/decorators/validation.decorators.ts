import express from 'express';
import {FieldErrors, ValidateError} from '@mathfalcon/tsoa-runtime';
import {ZodObject, ZodType} from 'zod';

export type ValidationSchema = ZodObject<{
  query?: ZodType;
  body?: ZodType;
  params?: ZodType;
}>;

// Function parameter Decorator Factory
// Overrides tsoa Body Decorator
export function Body() {
  return function (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    const existingMetadata =
      Reflect.getOwnMetadata('Body', target, propertyKey) || [];
    existingMetadata.push(parameterIndex);
    Reflect.defineMetadata('Body', existingMetadata, target, propertyKey);
  };
}

// Function parameter Decorator Factory
// Overrides tsoa Query Decorator
export function Query() {
  return function (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    const existingMetadata =
      Reflect.getOwnMetadata('Query', target, propertyKey) || [];
    existingMetadata.push(parameterIndex);
    Reflect.defineMetadata('Query', existingMetadata, target, propertyKey);
  };
}

// Function parameter Decorator Factory
// Overrides tsoa Params Decorator
export function Params() {
  return function (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    const existingMetadata =
      Reflect.getOwnMetadata('Params', target, propertyKey) || [];
    existingMetadata.push(parameterIndex);
    Reflect.defineMetadata('Params', existingMetadata, target, propertyKey);
  };
}

// Function Decorator Factory
export function ValidateBody(validationSchema: ValidationSchema) {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      // Retrieve the list of indices of the parameters that are decorated
      // in order to retrieve the body
      const bodyCandidates: number[] =
        Reflect.getOwnMetadata('Body', target, propertyKey) || [];
      if (bodyCandidates.length === 0) {
        throw new ValidateError(
          {
            body: {
              message: 'Body parameter is missing',
            },
          },
          'Body parameter is missing',
        );
      }
      const bodyIndex = bodyCandidates[0] as number;

      let rawBody = args[bodyIndex];
      let request: express.Request | null = null;

      // Try to find the Request object in args
      for (const arg of args) {
        if (
          arg &&
          typeof arg === 'object' &&
          'body' in arg &&
          'method' in arg &&
          'headers' in arg
        ) {
          request = arg;
          break;
        }
      }

      // Use the original body preserved in middleware before TSOA processes it
      // TSOA's getValidatedArgs strips nested Record types, so we need the original
      if (request) {
        const originalBody = (request as any).originalBody;
        if (originalBody) {
          // Use the original body that was preserved before TSOA processing
          rawBody = originalBody;
        } else {
          // Fallback to request.body if originalBody wasn't preserved
          rawBody = request.body;
        }
      }

      const bodySchema = validationSchema.shape.body;
      if (bodySchema) {
        // If rawBody is undefined or null, use empty object
        const bodyToValidate = rawBody ?? {};
        const check = await bodySchema.safeParseAsync(bodyToValidate);

        if (!check.success) {
          const errorPayload: FieldErrors = {};
          check.error.issues.map(issue => {
            errorPayload[issue.path.join(',')] = {
              message: issue.message,
              value: issue.code,
            };
          });
          throw new ValidateError(errorPayload, '');
        }

        // Replace the body argument with the validated data
        // This ensures the controller receives the correctly parsed body
        args[bodyIndex] = check.data;
      }

      // the payload checkout!
      // Call the original method with the arguments
      return originalMethod.apply(this, args);
    };
  };
}

// Function Decorator Factory
export function ValidateQuery(validationSchema: ValidationSchema) {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      // Retrieve the list of indices of the parameters that are decorated
      // Check for both @Query() and @Queries() decorators
      const queryCandidates: number[] =
        Reflect.getOwnMetadata('Query', target, propertyKey) || [];
      const queriesCandidates: number[] =
        Reflect.getOwnMetadata('Queries', target, propertyKey) || [];

      // Try to find the Request object in args (similar to ValidateBody)
      let request: express.Request | null = null;
      for (const arg of args) {
        if (
          arg &&
          typeof arg === 'object' &&
          'query' in arg &&
          'method' in arg &&
          'headers' in arg
        ) {
          request = arg;
          break;
        }
      }

      // Use @Queries() if available, otherwise fall back to @Query()
      const queryIndex =
        queriesCandidates.length > 0
          ? queriesCandidates[0]
          : queryCandidates.length > 0
          ? queryCandidates[0]
          : null;

      let rawQuery = queryIndex !== null ? args[queryIndex] : null;
      let actualQueryIndex = queryIndex;

      // Always use request.query for validation since it has the raw string values
      // that the schema expects (PaginationSchema expects strings and transforms them)
      // The args[queryIndex] might already be transformed by other middleware
      if (request && request.query) {
        rawQuery = request.query;
      }

      // Find the query parameter index for updating after validation
      if (actualQueryIndex === null && request && args.length > 0) {
        // Check each arg to see if it looks like a query object
        for (let i = 0; i < args.length; i++) {
          const arg = args[i];
          if (
            arg &&
            typeof arg === 'object' &&
            arg !== request && // Not the request object
            !('method' in arg) && // Not a request-like object
            Object.keys(arg).some(key =>
              ['page', 'limit', 'sortBy', 'sortOrder', 'status'].includes(key),
            )
          ) {
            actualQueryIndex = i;
            break;
          }
        }
      }

      if (!rawQuery && actualQueryIndex === null) {
        console.error('[ValidateQuery] No query parameter found', {
          queryMetadata: Reflect.getOwnMetadata('Query', target, propertyKey),
          queriesMetadata: Reflect.getOwnMetadata(
            'Queries',
            target,
            propertyKey,
          ),
          allMetadataKeys: Reflect.getOwnMetadataKeys(target, propertyKey),
          requestQuery: request?.query,
          args: args.map((arg, idx) => ({
            index: idx,
            type: typeof arg,
            keys:
              typeof arg === 'object' && arg !== null ? Object.keys(arg) : null,
          })),
        });
        throw new ValidateError(
          {
            query: {
              message: 'Query parameter is missing',
            },
          },
          'Query parameter is missing',
        );
      }

      // we've found the query in the list of parameters
      // now we check if its payload is valid against the passed Zod schema
      const querySchema = validationSchema.shape.query;
      if (querySchema) {
        // Use empty object as fallback if query is null/undefined
        const queryToValidate = rawQuery ?? {};
        const check = await querySchema.safeParseAsync(queryToValidate);

        if (!check.success) {
          const errorPayload: FieldErrors = {};
          check.error.issues.map(issue => {
            errorPayload[issue.path.join(',')] = {
              message: issue.message,
              value: issue.code,
            };
          });
          throw new ValidateError(errorPayload, '');
        }

        // Replace the query argument with the validated data
        if (actualQueryIndex !== null) {
          args[actualQueryIndex] = check.data;
        } else if (request) {
          // If we couldn't find the index, update request.query directly
          Object.assign(request.query, check.data);
        }

        // If request.pagination is not set and we have pagination fields in the query,
        // set it here (in case pagination middleware hasn't run yet)
        if (request && !request.pagination && check.data) {
          const validatedQuery = check.data as any;
          if (
            typeof validatedQuery.page === 'number' ||
            typeof validatedQuery.limit === 'number'
          ) {
            const page = Math.max(1, validatedQuery.page || 1);
            const limit = Math.min(
              100,
              Math.max(1, validatedQuery.limit || 10),
            );
            const sortBy = validatedQuery.sortBy || 'createdAt';
            const sortOrder =
              validatedQuery.sortOrder === 'desc' ? 'desc' : 'asc';
            const offset = (page - 1) * limit;

            request.pagination = {
              page,
              limit,
              offset,
              sortBy,
              sortOrder,
            };
          }
        }
      }

      // the payload checkout!
      // Call the original method with the arguments
      return originalMethod.apply(this, args);
    };
  };
}

// Function Decorator Factory
export function ValidateParams(validationSchema: ValidationSchema) {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      // Retrieve the list of indices of the parameters that are decorated
      // in order to retrieve the params
      const paramsCandidates: number[] =
        Reflect.getOwnMetadata('Params', target, propertyKey) || [];
      if (paramsCandidates.length === 0) {
        throw new ValidateError(
          {
            params: {
              message: 'Params parameter is missing',
            },
          },
          'Params parameter is missing',
        );
      }
      const paramsIndex = paramsCandidates[0] as number;
      // we've found the params in the list of parameters
      // now we check if its payload is valid against the passed Zod schema

      const paramsSchema = validationSchema.shape.params;
      if (paramsSchema) {
        const check = await paramsSchema.safeParseAsync(args[paramsIndex]);
        if (!check.success) {
          const errorPayload: FieldErrors = {};
          check.error.issues.map(issue => {
            errorPayload[issue.path.join(',')] = {
              message: issue.message,
              value: issue.code,
            };
          });
          throw new ValidateError(errorPayload, '');
        }
      }

      // the payload checkout!
      // Call the original method with the arguments
      return originalMethod.apply(this, args);
    };
  };
}
