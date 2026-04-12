import express from 'express';
import {FieldErrors, ValidateError} from '@mathfalcon/tsoa-runtime';
import {ZodObject, ZodType} from 'zod';

function isExpressRequestLike(arg: unknown): arg is express.Request {
  if (arg === null || typeof arg !== 'object') {
    return false;
  }
  const o = arg as Record<string, unknown>;
  return typeof o.method === 'string' && 'headers' in o;
}

/** First parameter that is a plain object and not an Express request (typical `@Queries()` slot). */
function findFirstPlainControllerArgIndex(args: unknown[]): number | null {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === null || typeof arg !== 'object') {
      continue;
    }
    if (Array.isArray(arg)) {
      continue;
    }
    if (!isExpressRequestLike(arg)) {
      return i;
    }
  }
  return null;
}

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
      // Parameter indices from our `@Query()` decorator; `@Queries()` may be registered
      // by `@mathfalcon/tsoa-runtime` — use getMetadata (prototype chain) + own fallback.
      const queryCandidates: number[] =
        (Reflect.getMetadata('Query', target, propertyKey) as
          | number[]
          | undefined) ||
        Reflect.getOwnMetadata('Query', target, propertyKey) ||
        [];
      const queriesCandidates: number[] =
        (Reflect.getMetadata('Queries', target, propertyKey) as
          | number[]
          | undefined) ||
        Reflect.getOwnMetadata('Queries', target, propertyKey) ||
        [];

      let request: express.Request | null = null;
      for (const arg of args) {
        if (isExpressRequestLike(arg)) {
          request = arg;
          break;
        }
      }

      const metaQueryIndex =
        queriesCandidates.length > 0
          ? queriesCandidates[0]
          : queryCandidates.length > 0
            ? queryCandidates[0]
            : null;

      const inferredQueryIndex = findFirstPlainControllerArgIndex(args);

      // Prefer Reflect metadata when present; otherwise the first non-Request object
      // (TSOA passes `@Queries()` / `@Query()` values as plain objects).
      let actualQueryIndex =
        metaQueryIndex !== null ? metaQueryIndex : inferredQueryIndex;

      // Raw query for Zod: prefer stringly `req.query` when Request is in args
      // (PaginationSchema and similar use .transform on strings). Otherwise use the
      // resolved queries argument from TSOA.
      let rawQuery: Record<string, unknown> | null = null;
      if (request?.query && typeof request.query === 'object') {
        rawQuery = request.query as Record<string, unknown>;
      } else if (actualQueryIndex !== null) {
        const q = args[actualQueryIndex];
        if (q && typeof q === 'object' && !isExpressRequestLike(q)) {
          rawQuery = q as Record<string, unknown>;
        }
      }

      // If we have req.query but metadata missed the slot, still patch the queries param.
      if (request?.query && actualQueryIndex === null) {
        actualQueryIndex = inferredQueryIndex;
      }

      if (rawQuery === null || actualQueryIndex === null) {
        console.error('[ValidateQuery] No query parameter found', {
          queryMetadata:
            Reflect.getMetadata('Query', target, propertyKey) ??
            Reflect.getOwnMetadata('Query', target, propertyKey),
          queriesMetadata:
            Reflect.getMetadata('Queries', target, propertyKey) ??
            Reflect.getOwnMetadata('Queries', target, propertyKey),
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
