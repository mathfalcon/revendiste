import {z} from 'zod';
import {VALIDATION_MESSAGES} from '~/constants/error-messages';

export const SaveProducerEventDraftRouteSchema = z.object({
  body: z.object({
    eventProducerId: z.string().uuid(),
    eventId: z.string().uuid().optional(),
    name: z.string().min(1, VALIDATION_MESSAGES.NAME_REQUIRED).optional(),
    description: z.string().nullable().optional(),
    eventStartDate: z.string().datetime().optional(),
    eventEndDate: z.string().datetime().optional(),
    externalUrl: z
      .union([z.string().url(VALIDATION_MESSAGES.URL_INVALID), z.literal('')])
      .optional(),
    officialResaleEnabled: z.boolean().optional(),
    officialResaleMaxMarkupPercent: z.number().min(110).nullable().optional(),
    draftPayload: z.unknown().optional(),
  }),
});

export type SaveProducerEventDraftRouteBody = z.infer<
  typeof SaveProducerEventDraftRouteSchema
>['body'];
