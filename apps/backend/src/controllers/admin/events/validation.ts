import {z} from 'zod';
import {PaginationSchema} from '~/middleware';

// ============================================================================
// Events Query/List
// ============================================================================

export const AdminEventsQuerySchema = PaginationSchema.extend({
  includePast: z.coerce.boolean().optional().default(false),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const AdminEventsRouteSchema = z.object({
  query: AdminEventsQuerySchema,
});

export type AdminEventsQuery = z.infer<typeof AdminEventsQuerySchema>;

// ============================================================================
// Update Event
// ============================================================================

export const UpdateEventRouteSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'El nombre es requerido').optional(),
    description: z.string().nullable().optional(),
    eventStartDate: z.string().datetime().optional(),
    eventEndDate: z.string().datetime().optional(),
    // Note: Venue is now managed via eventVenues table - use venueId to reference
    externalUrl: z.string().url('URL inválida').optional(),
    qrAvailabilityTiming: z
      .enum(['3h', '6h', '12h', '24h', '48h', '72h'])
      .nullable()
      .optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export type UpdateEventRouteBody = z.infer<typeof UpdateEventRouteSchema>['body'];

// ============================================================================
// Ticket Waves
// ============================================================================

export const CreateTicketWaveRouteSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    description: z.string().nullable().optional(),
    faceValue: z.number().positive('El valor debe ser positivo'),
    currency: z.enum(['UYU', 'USD']),
    isSoldOut: z.boolean().optional().default(false),
    isAvailable: z.boolean().optional().default(true),
    externalId: z.string().optional(),
  }),
});

export type CreateTicketWaveRouteBody = z.infer<
  typeof CreateTicketWaveRouteSchema
>['body'];

export const UpdateTicketWaveRouteSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'El nombre es requerido').optional(),
    description: z.string().nullable().optional(),
    faceValue: z.number().positive('El valor debe ser positivo').optional(),
    currency: z.enum(['UYU', 'USD']).optional(),
    isSoldOut: z.boolean().optional(),
    isAvailable: z.boolean().optional(),
  }),
});

export type UpdateTicketWaveRouteBody = z.infer<
  typeof UpdateTicketWaveRouteSchema
>['body'];

// ============================================================================
// Event Images
// ============================================================================

export const UploadEventImageRouteSchema = z.object({
  body: z.object({
    imageType: z.enum(['flyer', 'hero']),
  }),
});

export type UploadEventImageRouteBody = z.infer<
  typeof UploadEventImageRouteSchema
>['body'];
