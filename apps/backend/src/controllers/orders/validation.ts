import z from 'zod';
import {ORDER_ERROR_MESSAGES} from '~/constants/error-messages';

export const CreateOrderRouteSchema = z.object({
  body: z.object({
    eventId: z.uuid(ORDER_ERROR_MESSAGES.INVALID_EVENT_ID),
    ticketSelections: z.record(
      z.string(), // tanda de tickets ID
      z.record(
        z.string(), // precio del grupo
        z
          .number({
            message: ORDER_ERROR_MESSAGES.INVALID_QUANTITY_TYPE,
          })
          .min(0, ORDER_ERROR_MESSAGES.QUANTITY_TOO_LOW)
          .max(10, ORDER_ERROR_MESSAGES.QUANTITY_TOO_HIGH), // cantidad
      ),
    ),
  }),
});

export type CreateOrderRouteBody = z.infer<
  typeof CreateOrderRouteSchema
>['body'];
