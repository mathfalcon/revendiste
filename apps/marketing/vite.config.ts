import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'src/web/ui'),
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src/web/ui'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/web'),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:4001',
      '/ws': {target: 'ws://127.0.0.1:4001', ws: true},
    },
  },
});
