import {VITE_APP_API_URL} from '~/config/env';
import {Api} from './generated';
import {AxiosError} from 'axios';
import {redirect} from '@tanstack/react-router';
import {auth} from '@clerk/tanstack-react-start/server';
import {toast} from 'sonner';

export interface StandardizedErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  metadata?: Record<string, any>;
}

export interface PendingOrderErrorResponse extends StandardizedErrorResponse {
  statusCode: 422;
  metadata: {
    orderId: string;
  };
}

export const api = new Api({
  baseURL: VITE_APP_API_URL,
  withCredentials: true,
});

// Add request interceptor to handle token refresh
api.instance.interceptors.request.use(
  async config => {
    if (typeof window === 'undefined') {
      // Add User-Agent header for server-side requests to avoid Cloudflare blocking
      // Cloudflare may block requests without proper User-Agent headers
      if (!config.headers['User-Agent']) {
        config.headers['User-Agent'] =
          'Mozilla/5.0 (compatible; Revendiste-SSR/1.0)';
      }

      // Get fresh token for each request
      try {
        const {getToken} = await auth();
        const token = await getToken();

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (authError) {
        // If auth fails during SSR, log but don't block the request
        // The request might still work if it doesn't require auth
        console.warn('Failed to get auth token during SSR:', authError);
      }

      return config;
    }

    return config;
  },
  error => Promise.reject(error),
);

api.instance.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response && error.response.status === 401) {
      throw redirect({to: '/ingresar/$', throw: true});
    }

    // Handle 403 Forbidden - might be Cloudflare challenge or auth issue
    // During SSR, if we get a 403, it might be because auth token wasn't available
    // In this case, we should let the client-side retry handle it
    if (error.response && error.response.status === 403) {
      // If it's a Cloudflare challenge page (HTML response), this is likely an SSR issue
      const contentType = error.response.headers['content-type'] || '';
      if (contentType.includes('text/html')) {
        // This is likely a Cloudflare challenge - log and let client-side handle it
        console.warn(
          'Received 403 with HTML response (likely Cloudflare challenge) during SSR',
        );
        // Don't throw redirect here - let the error bubble up so client-side can retry
      }
    }

    // Handle standardized error responses from backend
    if (error.response?.data) {
      const errorData = error.response.data as StandardizedErrorResponse;

      // Check if it's a standardized error response with a message
      if (errorData?.message && typeof errorData.message === 'string') {
        // Only show toast in browser (client-side)
        if (typeof window !== 'undefined') {
          toast.error(errorData.message);
        }
      }
    }

    return Promise.reject(error);
  },
);

export * from './events';
export * from './ticket-listings';
export * from './order';
export * from './payments';
export * from './generated';
