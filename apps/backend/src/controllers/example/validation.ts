import {z} from 'zod';

export const GetExampleByIdRouteSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});

export type GetExampleByIdRouteParams = z.infer<typeof GetExampleByIdRouteSchema>["params"];