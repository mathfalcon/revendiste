import {VITE_APP_API_URL} from '../../config/env';
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

// During SSR, use Cloud Map DNS for direct backend access
// On client-side, use the normal API URL (through Cloudflare)
const getApiBaseURL = () => {
  if (typeof window === 'undefined' && process.env.BACKEND_IP) {
    // Server-side: use Cloud Map DNS for direct VPC communication
    // BACKEND_IP = "backend.revendiste.local:3001"
    // Traffic goes directly: Frontend ECS → Backend ECS (private IPs)
    // Benefits: Lower latency, no ALB hop, no Internet Gateway roundtrip
    return `http://${process.env.BACKEND_IP}/api`;
  }
  // Client-side: use normal API URL (through Cloudflare)
  return VITE_APP_API_URL;
};

export const api = new Api({
  baseURL: getApiBaseURL(),
  withCredentials: true,
});

// Add request interceptor to handle token refresh
api.instance.interceptors.request.use(
  async config => {
    if (typeof window === 'undefined') {
      // Get fresh token for each request during SSR
      try {
        const {getToken} = await auth();
        const baseURL = getApiBaseURL();
        const token = await getToken();
        config.baseURL = baseURL;
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

    // Don't show toast for 404 errors on event routes (handled by notFoundComponent)
    // This prevents showing "event not found" toasts during prefetch
    const isEvent404 =
      error.response?.status === 404 && error.config?.url?.includes('/events/');

    // Handle standardized error responses from backend
    if (error.response?.data) {
      const errorData = error.response.data as StandardizedErrorResponse;

      // Check if it's a standardized error response with a message
      if (errorData?.message && typeof errorData.message === 'string') {
        // Only show toast in browser (client-side)
        // Skip toasts for event 404s (they're handled by notFoundComponent)
        if (typeof window !== 'undefined' && !isEvent404) {
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
export * from './payouts';
export * from './users';
export * from './generated';
