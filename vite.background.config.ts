import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    lib: {
      entry: path.resolve(__dirname, 'src/background.ts'),
      formats: ['iife'],
      fileName: () => 'background.js',
      name: 'RecessBackground',
    },
  },
});
