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
      // Get fresh token for each request
      const {getToken} = await auth();
      const token = await getToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
