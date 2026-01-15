import {clerkMiddleware} from '@clerk/tanstack-react-start/server';
import {createStart, createMiddleware} from '@tanstack/react-start';
import {config} from 'dotenv';

// Load dotenv only once on server side (in request middleware)
let envLoaded = false;
const isLocal =
  process.env.NODE_ENV === 'local' || process.env.VITE_APP_ENV === 'local';

const envMiddleware = createMiddleware({
  type: 'request',
}).server(({next}) => {
  // Only run on server (process is undefined in browser) and only once
  if (typeof process !== 'undefined' && !envLoaded && !isLocal) {
    config({quiet: false});

    envLoaded = true;
  }
  return next();
});

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [envMiddleware, clerkMiddleware()],
  };
});
