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
