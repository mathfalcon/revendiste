import {tanstackStart} from '@tanstack/react-start/plugin/vite';
import {defineConfig, PluginOption} from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import {generateApiPlugin} from './vite-plugin-generate-api';
import {nitro} from 'nitro/vite';
import fs from 'node:fs';
import path from 'node:path';

// HTTPS_LOCAL mode for local development with camera APIs and service workers
// Nitro is disabled in this mode due to HTTP/2 header conflicts
const useHttpsLocal = process.env.HTTPS_LOCAL === '1';

// Use mkcert-generated certs for trusted HTTPS
// Generate with: mkcert localhost 127.0.0.1 ::1 192.168.2.1
function getMkcertOptions() {
  const dir = __dirname;
  const files = fs.readdirSync(dir);
  const certFile = files.find(
    f =>
      f.startsWith('localhost+') && f.endsWith('.pem') && !f.includes('-key'),
  );
  const keyFile = certFile ? certFile.replace('.pem', '-key.pem') : undefined;
  if (certFile && keyFile && fs.existsSync(path.join(dir, keyFile))) {
    return {
      cert: fs.readFileSync(path.join(dir, certFile)),
      key: fs.readFileSync(path.join(dir, keyFile)),
    };
  }
  return undefined;
}

const config = defineConfig(({mode}) => {
  const httpsOptions = useHttpsLocal ? getMkcertOptions() : undefined;

  return {
    server: {
      port: 3000,
      allowedHosts: ['chaotically-suppling-elvira.ngrok-free.dev'],
      host: '0.0.0.0',
      // Use mkcert certs for trusted HTTPS when HTTPS_LOCAL=1
      https: httpsOptions,
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
