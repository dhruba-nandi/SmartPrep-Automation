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
    // Full-page, so a failure screenshot shows form validation errors that sit above the
    // scrolled viewport rather than only the part of the form that happened to be on screen.
    screenshot: { mode: 'only-on-failure', fullPage: true },
    video: 'retain-on-failure',
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
        viewport: null,
        deviceScaleFactor: undefined,
        launchOptions: {
          args: ['--ignore-certificate-errors', '--user-data-dir=./browser-data/playwright-chrome', '--start-maximized'],
        },
      },
    },
  ],
});
