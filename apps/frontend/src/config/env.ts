import {z} from 'zod';

const EnvSchema = z.object({
  VITE_APP_API_URL: z.string(),
  // Fee configuration
  VITE_PLATFORM_COMMISSION_RATE: z.coerce.number().min(0).max(1).default(0.06), // 6%
  VITE_VAT_RATE: z.coerce.number().min(0).max(1).default(0.22), // 22%
});

export const env = EnvSchema.safeParse(import.meta.env);

if (!env.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment variables:', z.treeifyError(env.error));
  process.exit(1);
}

export const {VITE_APP_API_URL, VITE_PLATFORM_COMMISSION_RATE, VITE_VAT_RATE} =
  env.data;
