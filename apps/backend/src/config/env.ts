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
  STORAGE_BASE_URL: z.string().default('http://localhost:3001'),
  // AWS S3 configuration (only required when STORAGE_TYPE=s3)
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
  // Payout configuration
  PAYOUT_MINIMUM_UYU: z.coerce.number().default(1000), // $1,000 UYU
  PAYOUT_MINIMUM_USD: z.coerce.number().default(25), // $25 USD
  PAYOUT_HOLD_PERIOD_HOURS: z.coerce.number().default(48), // 48 hours post-event
  // Exchange rate configuration (for currency conversion)
  EXCHANGE_RATE_PROVIDER: z
    .enum(['exchange_rate_api', 'uruguay_bank', 'fallback'])
    .optional()
    .default('exchange_rate_api'), // Default to ExchangeRate-API
  EXCHANGE_RATE_API_KEY: z.string().optional(),
  EXCHANGE_RATE_API_URL: z.url().optional(),
  EXCHANGE_RATE_FALLBACK_UYU_TO_USD: z.coerce
    .number()
    .optional()
    .default(0.0247), // ~40.5 UYU = 1 USD
  EXCHANGE_RATE_CACHE_TTL_HOURS: z.coerce.number().default(1),
});

export const env = EnvSchema.safeParse(process.env);

if (!env.success) {
  console.error('Invalid environment variables:', z.treeifyError(env.error));
  console.error('Environment variables:', JSON.stringify(env.error, null, 2));
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
  PAYOUT_MINIMUM_UYU,
  PAYOUT_MINIMUM_USD,
  PAYOUT_HOLD_PERIOD_HOURS,
  EXCHANGE_RATE_PROVIDER,
  EXCHANGE_RATE_API_KEY,
  EXCHANGE_RATE_API_URL,
  EXCHANGE_RATE_FALLBACK_UYU_TO_USD,
  EXCHANGE_RATE_CACHE_TTL_HOURS,
} = env.data;
