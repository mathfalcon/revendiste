import z from 'zod';

export const CreateTicketListingRouteSchema = z.object({
  body: z.object({
    eventId: z.uuid(),
    ticketWaveId: z.uuid(),
    price: z.number().min(1),
    quantity: z.number().min(1).max(10),
  }),
});

export type CreateTicketListingRouteBody = z.infer<
  typeof CreateTicketListingRouteSchema
>['body'];

export const UpdateTicketPriceRouteSchema = z.object({
  body: z.object({
    price: z.number().min(1),
  }),
});

export type UpdateTicketPriceRouteBody = z.infer<
  typeof UpdateTicketPriceRouteSchema
>['body'];
