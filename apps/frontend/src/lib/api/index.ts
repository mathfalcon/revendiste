import {VITE_APP_API_URL} from '~/config/env';
import {Api} from './generated';
import {AxiosError} from 'axios';
import {redirect} from '@tanstack/react-router';

export const api = new Api({baseURL: VITE_APP_API_URL, withCredentials: true});

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
export * from './generated';
