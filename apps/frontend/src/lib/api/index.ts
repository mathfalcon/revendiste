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

// During SSR, use backend IP directly to bypass Cloudflare
// On client-side, use the normal API URL (through Cloudflare)
const getApiBaseURL = () => {
  if (typeof window === 'undefined' && process.env.BACKEND_IP) {
    // Server-side: use direct backend IP (bypasses Cloudflare)
    // Use HTTP since it's internal to the infrastructure
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
