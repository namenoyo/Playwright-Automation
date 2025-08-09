// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  // retries: process.env.CI ? 2 : 0,
  retries: 2,
  /* Opt out of parallel tests on CI. */
  workers: undefined,
  // workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  globalSetup: './config/global-setup.js',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
   video: 'retain-on-failure', // ปิดการอัดวิดีโอ
   
    // video: 'retain-on-failure', // หรือ 'on' ถ้าอยากเก็บทุกเคส
    // screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        // ...devices['Desktop Chrome'],
        headless: true,
        viewport: { width: 1366, height: 768 },
        screen: { width: 1366, height: 768 },
        launchOptions: {
          args: ['--window-size=1080,1920'],
        },
      },
    },

    // {
    //   name: 'firefox',
    //   use: {
    //     // ...devices['Desktop Firefox'],
    //     headless: true,
    //     viewport: { width: 1366, height: 768 },
    //     screen: { width: 1366, height: 768 },
    //     launchOptions: {
    //       args: ['--window-size=1080,1920'],
    //     },
    //   },
    // },

    // {
    //   name: 'webkit',
    //   use: {
    //     // ...devices['Desktop Safari'],
    //     headless: true,
    //     viewport: { width: 1366, height: 768 },
    //     screen: { width: 1366, height: 768 },
    //     launchOptions: {
    //       args: ['--window-size=1080,1920'],
    //     },
    //   },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

