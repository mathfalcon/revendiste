import {z} from 'zod';

export const MetaCapiRouteSchema = z.object({
  body: z.object({
    eventName: z.enum(['Purchase', 'InitiateCheckout', 'ViewContent']),
    eventId: z.string().min(1),
    eventSourceUrl: z.string().url(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    currency: z.string().length(3).optional(),
    value: z.number().nonnegative().optional(),
  }),
});

export type MetaCapiRouteBody = z.infer<typeof MetaCapiRouteSchema>['body'];

export const TikTokEventsRouteSchema = z.object({
  body: z.object({
    event: z.string().min(1),
    eventId: z.string().min(1),
    timestamp: z.string().optional(),
    eventSourceUrl: z.string().url(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    value: z.number().nonnegative().optional(),
    currency: z.string().length(3).optional(),
  }),
});

export type TikTokEventsRouteBody = z.infer<
  typeof TikTokEventsRouteSchema
>['body'];
