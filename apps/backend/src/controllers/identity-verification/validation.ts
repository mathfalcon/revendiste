import {z} from 'zod';
import {VALIDATION_MESSAGES} from '~/constants/error-messages';

export const InitiateVerificationRouteSchema = z.object({
  body: z
    .object({
      documentType: z.enum(['ci_uy', 'dni_ar', 'passport']),
      documentNumber: z.string().min(1),
      documentCountry: z.string().length(3).optional(),
    })
    .refine(
      data => {
        // Country is required only for passports
        if (data.documentType === 'passport') {
          return !!data.documentCountry;
        }
        return true;
      },
      {
        message: VALIDATION_MESSAGES.DOCUMENT_COUNTRY_REQUIRED_PASSPORT,
        path: ['documentCountry'],
      },
    ),
});

export type InitiateVerificationRouteBody = z.infer<
  typeof InitiateVerificationRouteSchema
>['body'];

export const VerifyDocumentsRouteSchema = z.object({
  body: z.object({
    documentType: z.enum(['ci_uy', 'dni_ar', 'passport']),
  }),
});

export type VerifyDocumentsRouteBody = z.infer<
  typeof VerifyDocumentsRouteSchema
>['body'];

export const VerifyLivenessRouteSchema = z.object({
  body: z.object({
    sessionId: z.string().min(1),
  }),
});

export type VerifyLivenessRouteBody = z.infer<
  typeof VerifyLivenessRouteSchema
>['body'];
