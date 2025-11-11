import z from 'zod';

export const DLocalWebhookValidationSchema = z.object({
  body: z.object({
    payment_id: z.string(),
  }),
});

export type DLocalWebhookrRouteBody = z.infer<
  typeof DLocalWebhookValidationSchema
>['body'];
