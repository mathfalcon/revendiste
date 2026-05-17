import {z} from 'zod';
import {VALIDATION_MESSAGES} from '~/constants/error-messages';

const EventProducerFeePairSchema = z.object({
  defaultProducerFeeAmount: z.number().nonnegative().nullable().optional(),
  defaultProducerFeeCurrency: z
    .enum(['UYU', 'USD', 'ARS'])
    .nullable()
    .optional(),
});

const validateEventProducerFeePair = (
  values: z.infer<typeof EventProducerFeePairSchema>,
  ctx: z.RefinementCtx,
) => {
  const hasAmount = values.defaultProducerFeeAmount !== undefined;
  const hasCurrency = values.defaultProducerFeeCurrency !== undefined;
  if (hasAmount !== hasCurrency) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'La comisión fija de la productora requiere monto y moneda juntos',
      path: ['defaultProducerFeeAmount'],
    });
  }
};

const EventProducerBaseSchema = z.object({
  name: z.string().min(1, VALIDATION_MESSAGES.NAME_REQUIRED),
  slug: z
    .string()
    .min(1, 'El identificador es requerido')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'El identificador solo puede incluir letras minúsculas, números y guiones',
    )
    .optional(),
  legalName: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  contactEmail: z.string().email('Email inválido').nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  defaultBuyerCommissionRate: z.number().min(0).max(1).nullable().optional(),
  ownerUserId: z.string().uuid().optional(),
});

export const AdminEventProducersListRouteSchema = z.object({
  query: z.object({
    search: z.string().optional(),
  }),
});

export type AdminEventProducersListQuery = z.infer<
  typeof AdminEventProducersListRouteSchema
>['query'];

export const CreateEventProducerRouteSchema = z.object({
  body: EventProducerBaseSchema.extend(
    EventProducerFeePairSchema.shape,
  ).superRefine(validateEventProducerFeePair),
});

export type CreateEventProducerRouteBody = z.infer<
  typeof CreateEventProducerRouteSchema
>['body'];

export const UpdateEventProducerRouteSchema = z.object({
  body: EventProducerBaseSchema.partial()
    .omit({ownerUserId: true, name: true})
    .extend({
      name: z.string().min(1, VALIDATION_MESSAGES.NAME_REQUIRED).optional(),
    })
    .extend(EventProducerFeePairSchema.partial().shape)
    .superRefine(validateEventProducerFeePair)
    .refine(
      body => Object.keys(body).length > 0,
      'Debés enviar al menos un campo para actualizar',
    ),
});

export type UpdateEventProducerRouteBody = z.infer<
  typeof UpdateEventProducerRouteSchema
>['body'];

export const AddEventProducerMemberRouteSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    role: z.enum(['owner', 'manager', 'viewer']),
    accepted: z.boolean().optional(),
  }),
});

export type AddEventProducerMemberRouteBody = z.infer<
  typeof AddEventProducerMemberRouteSchema
>['body'];

export const UpdateEventProducerMemberRoleRouteSchema = z.object({
  body: z.object({
    role: z.enum(['owner', 'manager', 'viewer']),
  }),
});

export type UpdateEventProducerMemberRoleRouteBody = z.infer<
  typeof UpdateEventProducerMemberRoleRouteSchema
>['body'];
