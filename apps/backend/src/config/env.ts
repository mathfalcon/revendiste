import {z} from 'zod';
import 'dotenv/config';

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['local', 'development', 'production', 'test'])
    .default('local'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  PORT: z.coerce.number().default(3001),
  // Database connection - either use DATABASE_URL or individual POSTGRES_* variables
  DATABASE_URL: z.string().optional(), // Takes precedence if set (e.g., Supabase pooler URL)
  POSTGRES_USER: z.string().optional().default('postgres'),
  POSTGRES_PASSWORD: z.string().optional().default(''),
  POSTGRES_DB: z.string().optional().default('postgres'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_HOST: z.string().default('localhost'),
  CLERK_PUBLISHABLE_KEY: z.string(),
  CLERK_SECRET_KEY: z.string(),
  CLERK_WEBHOOK_SECRET: z.string(),
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
  AWS_REGION: z.string().default('sa-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_CLOUDFRONT_DOMAIN: z.string().optional(), // Optional CDN domain
  AWS_S3_SIGNED_URL_EXPIRY: z.coerce.number().optional().default(3600), // 1 hour default
  // Face Liveness IAM Role (backend assumes this role to get scoped credentials for frontend)
  FACE_LIVENESS_ROLE_ARN: z.string().optional(),
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
  // WhatsApp configuration
  WHATSAPP_PROVIDER: z
    .enum(['console', 'whatsapp_business'])
    .default('console'),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1),
  WHATSAPP_API_VERSION: z.string().default('v21.0'),
  // Payout configuration
  PAYOUT_MINIMUM_UYU: z.coerce.number().default(500), // 500 UYU
  PAYOUT_MINIMUM_USD: z.coerce.number().default(12.5), // $25 USD
  /** Payouts v3 AR: minimum destination amount in ARS (dLocal Go / Argentina) */
  PAYOUT_MINIMUM_ARS: z.coerce.number().default(25_000),
  PAYOUT_HOLD_PERIOD_HOURS: z.coerce.number().default(48), // 48 hours post-event
  PAYOUT_FX_SPREAD_PERCENT: z.coerce.number().min(0).max(10).default(1),
  PAYOUT_FX_RATE_LOCK_HOURS: z.coerce.number().min(1).max(168).default(72),
  // dLocal Payouts v3 (overrides DLOCAL_BASE_URL for `/payouts/v3` if needed)
  DLOCAL_PAYOUTS_BASE_URL: z.preprocess(
    v => (v === '' || v == null ? undefined : v),
    z.string().url().optional(),
  ),
  DLOCAL_PAYOUTS_TIMEOUT_MS: z.coerce.number().min(1_000).default(30_000),
  DLOCAL_PAYOUT_REMITTER_FIRST_NAME: z.string().min(1).optional(),
  DLOCAL_PAYOUT_REMITTER_LAST_NAME: z.string().min(1).optional(),
  DLOCAL_PAYOUT_REMITTER_EMAIL: z.string().email().optional(),
  DLOCAL_PAYOUT_REMITTER_PHONE: z.string().min(1).optional(),
  DLOCAL_PAYOUT_REMITTER_NATIONALITY: z.string().length(2).default('UY'),
  DLOCAL_PAYOUT_REMITTER_DOCUMENT_ID: z.string().min(1).optional(),
  DLOCAL_PAYOUT_REMITTER_DOCUMENT_TYPE: z
    .string()
    .min(1)
    .default('NATIONAL_ID'),
  DLOCAL_PAYOUT_NOTIFICATION_URL: z.preprocess(
    v => (v === '' || v == null ? undefined : v),
    z.string().url().optional(),
  ),
  // Exchange rate cache (BROU eBROU via UruguayBankProvider only)
  EXCHANGE_RATE_CACHE_TTL_HOURS: z.coerce.number().default(1),
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  // PostHog analytics
  POSTHOG_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().optional().default('https://e-proxy.revendiste.com'),
  // Rate limiting (Postgres-backed; optional, defaults apply to /api)
  RATE_LIMIT_WINDOW_MS: z.coerce.number().optional().default(60_000), // 1 minute
  RATE_LIMIT_MAX: z.coerce.number().optional().default(100), // max requests per window per IP
  // FEU Electronic Invoicing (optional; required for invoice generation)
  FEU_ENV: z.enum(['test', 'prod']).optional().default('test'),
  FEU_AUTH_URL: z.url().nonempty(),
  FEU_API_BASE_URL: z.url().nonempty(),
  FEU_USERNAME: z.string().optional(),
  FEU_PASSWORD: z.string().optional(),
  FEU_REFRESH_TOKEN: z.string().nonempty(), // Long-lived (e.g. 365 days); update in secrets yearly
  FEU_EMISOR_RUT: z.string().nonempty(),
  FEU_SUCURSAL: z.coerce.number().default(1),
  FEU_REQUEST_TIMEOUT_MS: z.coerce.number().optional().default(30_000),
  // Web Push (VAPID) — generate with `npx web-push generate-vapid-keys`
  VAPID_PUBLIC_KEY: z.string().nonempty(),
  VAPID_PRIVATE_KEY: z.string().nonempty(),
  VAPID_SUBJECT: z.string().optional().default('mailto:ayuda@revendiste.com'),
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
  DATABASE_URL,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
  POSTGRES_PORT,
  POSTGRES_HOST,
  CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY,
  CLERK_WEBHOOK_SECRET,
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
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_CLOUDFRONT_DOMAIN,
  AWS_S3_SIGNED_URL_EXPIRY,
  FACE_LIVENESS_ROLE_ARN,
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
  WHATSAPP_PROVIDER,
  WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_API_VERSION,
  PAYOUT_MINIMUM_UYU,
  PAYOUT_MINIMUM_USD,
  PAYOUT_MINIMUM_ARS,
  PAYOUT_HOLD_PERIOD_HOURS,
  PAYOUT_FX_SPREAD_PERCENT,
  PAYOUT_FX_RATE_LOCK_HOURS,
  DLOCAL_PAYOUTS_BASE_URL,
  DLOCAL_PAYOUTS_TIMEOUT_MS,
  DLOCAL_PAYOUT_REMITTER_FIRST_NAME,
  DLOCAL_PAYOUT_REMITTER_LAST_NAME,
  DLOCAL_PAYOUT_REMITTER_EMAIL,
  DLOCAL_PAYOUT_REMITTER_PHONE,
  DLOCAL_PAYOUT_REMITTER_NATIONALITY,
  DLOCAL_PAYOUT_REMITTER_DOCUMENT_ID,
  DLOCAL_PAYOUT_REMITTER_DOCUMENT_TYPE,
  DLOCAL_PAYOUT_NOTIFICATION_URL,
  EXCHANGE_RATE_CACHE_TTL_HOURS,
  GOOGLE_PLACES_API_KEY,
  POSTHOG_KEY,
  POSTHOG_HOST,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  FEU_ENV,
  FEU_AUTH_URL,
  FEU_API_BASE_URL,
  FEU_USERNAME,
  FEU_PASSWORD,
  FEU_REFRESH_TOKEN,
  FEU_EMISOR_RUT,
  FEU_SUCURSAL,
  FEU_REQUEST_TIMEOUT_MS,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
  VAPID_SUBJECT,
} = env.data;
