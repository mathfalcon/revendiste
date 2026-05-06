import {z} from 'zod';

export const usuariosSearchSchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  sortBy: z
    .enum(['createdAt', 'email', 'lastActiveAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  buscar: z.string().optional(),
});

export type UsuariosSearch = z.infer<typeof usuariosSearchSchema>;
