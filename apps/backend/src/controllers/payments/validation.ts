import {z} from 'zod';

/** ISO 3166-1 alpha-2. Supported by dLocal Go for checkout; default UY if omitted. */
export const CreatePaymentLinkRouteSchema = z.object({
  body: z
    .object({
      country: z
        .string()
        .length(2, 'Country must be ISO 3166-1 alpha-2 (2 letters)')
        .toUpperCase()
        .optional(),
    })
    .optional(),
});

export type CreatePaymentLinkRouteBody = z.infer<
  typeof CreatePaymentLinkRouteSchema
>['body'];
