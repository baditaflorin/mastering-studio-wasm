import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:4173/mastering-studio-wasm/';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 15_000
  },
  use: {
    baseURL,
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: process.env.PLAYWRIGHT_USE_EXTERNAL_SERVER
    ? undefined
    : {
        command: 'npm run dev -- --port 4173',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000
      }
});
