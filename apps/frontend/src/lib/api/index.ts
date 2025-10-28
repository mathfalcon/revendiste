import {VITE_APP_API_URL} from '~/config/env';
import {Api} from './generated';
import {AxiosError} from 'axios';
import {redirect} from '@tanstack/react-router';
import {auth} from '@clerk/tanstack-react-start/server';

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
      return redirect({to: '/ingresar/$', throw: true});
    }
    return Promise.reject(error);
  },
);

export * from './events';
export * from './ticket-listings';
export * from './generated';
