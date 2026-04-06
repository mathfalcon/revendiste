import {z} from 'zod';

export const SubscribePushRouteSchema = z.object({
  body: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
    userAgent: z.string().optional(),
  }),
});

export type SubscribePushRouteBody = z.infer<
  typeof SubscribePushRouteSchema
>['body'];

export const UnsubscribePushRouteSchema = z.object({
  body: z.object({
    endpoint: z.string().url(),
  }),
});

export type UnsubscribePushRouteBody = z.infer<
  typeof UnsubscribePushRouteSchema
>['body'];
