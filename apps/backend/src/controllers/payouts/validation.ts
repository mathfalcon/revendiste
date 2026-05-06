import z from 'zod';
import {PAYOUT_ERROR_MESSAGES} from '~/constants/error-messages';
import {PayoutMethodBaseSchema} from '@revendiste/shared';

export const RequestPayoutRouteSchema = z.object({
  body: z
    .object({
      payoutMethodId: z.uuid(PAYOUT_ERROR_MESSAGES.INVALID_PAYOUT_METHOD),
      listingTicketIds: z.array(z.uuid()).optional(),
      listingIds: z.array(z.uuid()).optional(),
    })
    .strict()
    .refine(
      data =>
        (data.listingTicketIds?.length ?? 0) > 0 ||
        (data.listingIds?.length ?? 0) > 0,
      {
        message: PAYOUT_ERROR_MESSAGES.NO_EARNINGS_SELECTED,
      },
    ),
});

export type RequestPayoutRouteBody = z.infer<
  typeof RequestPayoutRouteSchema
>['body'];

/**
 * Add payout method route schema
 * Uses discriminated union from shared for payoutType + metadata; currency matches type.
 */
export const AddPayoutMethodRouteSchema = z.object({
  body: PayoutMethodBaseSchema.and(
    z.object({
      accountHolderName: z.string().min(1),
      accountHolderSurname: z.string().min(1),
      currency: z.enum(['ARS', 'UYU', 'USD']),
      isDefault: z.boolean().optional(),
    }),
  ).refine(
    b =>
      (b.payoutType === 'uruguayan_bank' &&
        (b.currency === 'UYU' || b.currency === 'USD')) ||
      (b.payoutType === 'argentinian_bank' &&
        (b.currency === 'ARS' || b.currency === 'USD')),
    {message: 'Moneda no válida para el tipo de retiro indicado.'},
  ),
});

export type AddPayoutMethodRouteBody = z.infer<
  typeof AddPayoutMethodRouteSchema
>['body'];

/**
 * Update payout method route schema
 * Note: metadata validation is partial here since we don't have payoutType in the body.
 * Full validation happens in the service layer using the existing payout method's payoutType.
 * The service validates metadata using validatePayoutMethodMetadata() which uses the existing payoutType.
 */
export const UpdatePayoutMethodRouteSchema = z.object({
  body: z.object({
    accountHolderName: z.string().min(1).optional(),
    accountHolderSurname: z.string().min(1).optional(),
    currency: z.enum(['ARS', 'UYU', 'USD']).optional(),
    metadata: z.unknown().optional(),
    isDefault: z.boolean().optional(),
  }),
});

export type UpdatePayoutMethodRouteBody = z.infer<
  typeof UpdatePayoutMethodRouteSchema
>['body'];
