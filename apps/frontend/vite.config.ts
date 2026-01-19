import {tanstackStart} from '@tanstack/react-start/plugin/vite';
import {defineConfig, PluginOption} from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import {generateApiPlugin} from './vite-plugin-generate-api';
import {nitro} from 'nitro/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// HTTPS_LOCAL mode for local development with camera APIs
// Nitro is disabled in this mode due to HTTP/2 header conflicts
const useHttpsLocal = process.env.HTTPS_LOCAL === '1';

const config = defineConfig(({mode}) => {
  return {
    server: {
      port: 3000,
      allowedHosts: ['chaotically-suppling-elvira.ngrok-free.dev'],
      host: '0.0.0.0',
      // Proxy API requests to HTTP backend when running HTTPS
      // This avoids mixed content blocking
      proxy: useHttpsLocal
        ? {
            '/api': {
              target: 'http://localhost:3001',
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
    plugins: [
      // HTTPS plugin (only when HTTPS_LOCAL=1)
      ...(useHttpsLocal ? [basicSsl()] : []),
      tsConfigPaths({
        projects: ['./tsconfig.json'],
      }) as PluginOption,
      // Run API generation on dev server start
      generateApiPlugin({
        command: 'pnpm generate:api',
        runOnStart: true,
        // Retry 3 times with 2 second delays if backend isn't ready yet
        retries: 3,
        retryDelay: 2000,
        // Optionally run on file changes
        runOnChange: true,
        watchFiles: ['../backend/src/swagger/swagger.json'],
      }),
      // Nitro conflicts with HTTPS (HTTP/2 header issues), so disable it in HTTPS mode
      // SSR won't work in HTTPS mode, but camera APIs will work for testing
      ...(useHttpsLocal ? [] : [nitro()]),
      tanstackStart(),
      viteReact(),
      tailwindcss() as PluginOption,
    ],
  };
});

export default config;