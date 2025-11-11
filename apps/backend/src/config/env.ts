import {z} from 'zod';
import 'dotenv/config';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['local', 'development', 'production']).default('local'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  PORT: z.coerce.number().default(3001),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_HOST: z.string().default('localhost'),
  CLERK_PUBLISHABLE_KEY: z.string(),
  CLERK_SECRET_KEY: z.string(),
  // Fee configuration
  PLATFORM_COMMISSION_RATE: z.coerce.number().min(0).max(1).default(0.06), // 6%
  VAT_RATE: z.coerce.number().min(0).max(1).default(0.22), // 22%
  DLOCAL_API_KEY: z.string(),
  DLOCAL_SECRET_KEY: z.string(),
  DLOCAL_BASE_URL: z.url(),
  APP_BASE_URL: z.url(),
  API_BASE_URL: z.url(),
});

export const env = EnvSchema.safeParse(process.env);

if (!env.success) {
  console.error('Invalid environment variables:', z.treeifyError(env.error));
  process.exit(1);
}

export const {
  NODE_ENV,
  LOG_LEVEL,
  PORT,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
  POSTGRES_PORT,
  POSTGRES_HOST,
  CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY,
  PLATFORM_COMMISSION_RATE,
  VAT_RATE,
  DLOCAL_API_KEY,
  DLOCAL_SECRET_KEY,
  DLOCAL_BASE_URL,
  APP_BASE_URL,
  API_BASE_URL,
} = env.data;
