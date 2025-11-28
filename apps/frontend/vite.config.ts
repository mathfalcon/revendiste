import {tanstackStart} from '@tanstack/react-start/plugin/vite';
import {defineConfig, type Plugin} from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import {generateApiPlugin} from './vite-plugin-generate-api';

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),

    tanstackStart(),
    viteReact(),
    tailwindcss(),
    // // Run API generation on dev server start
    // generateApiPlugin({
    //   command: 'pnpm generate:api',
    //   runOnStart: true,
    //   // Retry 3 times with 2 second delays if backend isn't ready yet
    //   retries: 3,
    //   retryDelay: 2000,
    //   // Optionally run on file changes
    //   runOnChange: true,
    //   watchFiles: ['../backend/src/swagger/swagger.json'],
    // }),
  ],
});
