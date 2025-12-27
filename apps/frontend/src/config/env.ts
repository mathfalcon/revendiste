import {z} from 'zod';

const EnvSchema = z.object({
  VITE_APP_API_URL: z.string(),
  // Base URL for the frontend application (for SEO, canonical URLs, etc.)
  // Optional - defaults to window.location.origin in browser, or https://revendiste.com in SSR
  VITE_APP_BASE_URL: z.string().optional(),
  // Fee configuration
  VITE_PLATFORM_COMMISSION_RATE: z.coerce.number().min(0).max(1).default(0.06), // 6%
  VITE_VAT_RATE: z.coerce.number().min(0).max(1).default(0.22), // 22%
  // Backend IP for direct access during SSR (bypasses Cloudflare)
  // Optional - if not set, will use VITE_APP_API_URL even during SSR
  BACKEND_IP: z.string().optional(),
});

export const env = EnvSchema.safeParse(import.meta.env);

if (!env.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment variables:', z.treeifyError(env.error));
  process.exit(1);
}

export const {
  VITE_APP_API_URL,
  VITE_APP_BASE_URL,
  BACKEND_IP,
  VITE_PLATFORM_COMMISSION_RATE,
  VITE_VAT_RATE,
} = env.data;

// Helper function to get base URL
export const getBaseUrl = () => {
  if (VITE_APP_BASE_URL) {
    return VITE_APP_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://revendiste.com';
};
