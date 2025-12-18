import {clerkMiddleware} from '@clerk/tanstack-react-start/server';
import {createStart, createMiddleware} from '@tanstack/react-start';
import {config} from 'dotenv';

// Load dotenv only once on server side (in request middleware)
let envLoaded = false;
const envMiddleware = createMiddleware({
  type: 'request',
}).server(({next}) => {
  // Only run on server (process is undefined in browser) and only once
  if (typeof process !== 'undefined' && !envLoaded) {
    config();

    envLoaded = true;
  }
  return next();
});

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [envMiddleware, clerkMiddleware()],
  };
});
