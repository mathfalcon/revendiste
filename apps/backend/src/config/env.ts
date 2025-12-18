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
  // Storage configuration
  STORAGE_TYPE: z.enum(['local', 's3', 'r2']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./uploads'),
  STORAGE_BASE_URL: z.string().default('/uploads'),
  // AWS S3 configuration (only required when STORAGE_TYPE=s3)
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_CLOUDFRONT_DOMAIN: z.string().optional(), // Optional CDN domain
  AWS_S3_SIGNED_URL_EXPIRY: z.coerce.number().optional().default(3600), // 1 hour default
  // Cloudflare R2 configuration (only required when STORAGE_TYPE=r2)
  R2_PUBLIC_BUCKET: z.string().optional(),
  R2_PRIVATE_BUCKET: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_CDN_DOMAIN: z.string().optional(), // Optional CDN domain (e.g., 'cdn-dev.revendiste.com')
  R2_SIGNED_URL_EXPIRY: z.coerce.number().optional().default(300), // 5 minutes default
  // Email configuration
  EMAIL_PROVIDER: z.enum(['console', 'resend']).default('console'),
  EMAIL_FROM: z.string().default('noreply@revendiste.com'),
  // Resend configuration (when EMAIL_PROVIDER=resend)
  RESEND_API_KEY: z.string().optional(),
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
  STORAGE_TYPE,
  STORAGE_LOCAL_PATH,
  STORAGE_BASE_URL,
  AWS_S3_BUCKET,
  AWS_S3_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_CLOUDFRONT_DOMAIN,
  AWS_S3_SIGNED_URL_EXPIRY,
  R2_PUBLIC_BUCKET,
  R2_PRIVATE_BUCKET,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_CDN_DOMAIN,
  R2_SIGNED_URL_EXPIRY,
  EMAIL_PROVIDER,
  EMAIL_FROM,
  RESEND_API_KEY,
} = env.data;
