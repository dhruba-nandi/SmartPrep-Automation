import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  globalSetup: './global-setup.ts',
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['./reporters/jira-reporter.ts'],
  ],
  timeout: 300000,
  use: {
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
    launchOptions: {
      args: ['--ignore-certificate-errors'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: ['--ignore-certificate-errors', '--user-data-dir=./browser-data/playwright-chrome'],
        },
      },
    },
  ],
});
