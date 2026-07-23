import path from 'path';
import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import manifest from './manifest.config.js';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  publicDir: 'public',
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
  test: {
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', 'build/**'],
  },
});
