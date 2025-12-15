import {defineConfig} from 'tsup';
import {esbuildPluginFilePathExtensions} from 'esbuild-plugin-file-path-extensions';

export default defineConfig({
  entry: ['src/**/*.ts', 'emails/**/*.tsx', 'tailwind.config.ts'],
  format: ['esm'],
  dts: false, // Generate declarations separately with tsc to respect project references
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  bundle: true, // Required for plugin to work
  esbuildPlugins: [
    esbuildPluginFilePathExtensions({
      esm: true,
      esmExtension: 'js',
    }),
  ],
  external: [
    '@react-email/render',
    '@react-email/components',
    'react',
    'react-dom',
    '@revendiste/shared',
  ],
});
