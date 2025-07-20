import {z} from 'zod';

export const ExampleSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.date(),
});

export type Example = z.infer<typeof ExampleSchema>;
