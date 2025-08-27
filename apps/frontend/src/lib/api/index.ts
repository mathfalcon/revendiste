import {VITE_APP_API_URL} from '~/config/env';
import {Api} from './generated';

export const api = new Api({baseURL: VITE_APP_API_URL});

export * from './events';
export * from './generated';
