import {z} from 'zod';

const EnvSchema = z.object({
  VITE_APP_API_URL: z.string(),
});

export const env = EnvSchema.safeParse(import.meta.env);

if (!env.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment variables:', z.treeifyError(env.error));
  process.exit(1);
}

export const {VITE_APP_API_URL} = env.data;
