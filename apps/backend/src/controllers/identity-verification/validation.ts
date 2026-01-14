import {z} from 'zod';

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
        message: 'El país es requerido para pasaportes',
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
