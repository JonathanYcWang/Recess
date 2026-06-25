import { defineConfig, devices } from '@playwright/test';

const previewPort = 4173;
const baseURL = `http://127.0.0.1:${previewPort}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  outputDir: 'e2e/test-results',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${previewPort} --strictPort --host 127.0.0.1`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'compact-light-360',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 360, height: 640 },
        colorScheme: 'light',
      },
    },
    {
      name: 'compact-light-480',
      use: {
        viewport: { width: 480, height: 800 },
        colorScheme: 'light',
      },
    },
    {
      name: 'compact-dark-360',
      use: {
        viewport: { width: 360, height: 640 },
        colorScheme: 'dark',
      },
    },
    {
      name: 'full-tab-light-768',
      use: {
        viewport: { width: 768, height: 900 },
        colorScheme: 'light',
      },
    },
    {
      name: 'full-tab-dark-1024',
      use: {
        viewport: { width: 1024, height: 900 },
        colorScheme: 'dark',
      },
    },
    {
      name: 'compact-reduced-motion',
      use: {
        viewport: { width: 360, height: 640 },
        colorScheme: 'light',
        reducedMotion: 'reduce',
      },
    },
  ],
});
