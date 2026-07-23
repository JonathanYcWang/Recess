import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import path from 'path';
import manifest from './manifest.config';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  publicDir: 'public',
  test: {
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', 'build/**'],
  },
});
