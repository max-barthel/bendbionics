import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */

// Environment variable support
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';
const HEADLESS = process.env.PLAYWRIGHT_HEADLESS !== 'false';
const IS_CI = !!process.env.CI;

export default defineConfig({
  /* Test directory */
  testDir: './e2e',

  /* Timeout Configuration */
  /** Maximum time one test can run for (increased for lazy-loaded components) */
  timeout: 60 * 1000, // 60 seconds to accommodate lazy-loaded 3D visualizer
  /** Maximum time the whole test run can take */
  globalTimeout: 60 * 60 * 1000, // 1 hour
  /** Maximum time expect() can wait for assertion (increased for lazy-loaded components) */
  expect: {
    timeout: 15 * 1000, // 15 seconds to match our test waits for lazy-loaded components
    /** Threshold for visual regression tests (0.2 = 20% pixel difference allowed) */
    toHaveScreenshot: {
      threshold: 0.2,
      animations: 'disabled',
    },
  },

  /* Parallel Execution */
  /** Run tests in files in parallel */
  fullyParallel: true,
  /** Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: IS_CI,
  /** Retry failed tests (2 retries on CI, 0 locally) */
  retries: IS_CI ? 2 : 0,
  /** Worker configuration - 1 worker on CI for stability, unlimited locally for speed */
  workers: IS_CI ? 1 : undefined,

  /* Reporter Configuration */
  /** Conditional reporters: simpler on CI, detailed locally */
  reporter: IS_CI
    ? [
        ['list'],
        ['json', { outputFile: 'test-results/e2e-results.json' }],
        ['junit', { outputFile: 'test-results/e2e-results.xml' }],
      ]
    : [
        ['html'],
        ['json', { outputFile: 'test-results/e2e-results.json' }],
        ['junit', { outputFile: 'test-results/e2e-results.xml' }],
      ],

  /* Shared Settings for All Projects */
  use: {
    /** Base URL to use in actions like `await page.goto('/')` */
    baseURL: BASE_URL,

    /** Headless mode - controlled by environment variable */
    headless: HEADLESS,

    /** Navigation timeout - maximum time for navigation actions */
    navigationTimeout: 30 * 1000,
    /** Action timeout - maximum time for actions like click, fill, etc. */
    actionTimeout: 10 * 1000,

    /** Collect trace when retrying failed tests */
    trace: IS_CI ? 'on-first-retry' : 'retain-on-failure',

    /** Take screenshot on failure */
    screenshot: 'only-on-failure',

    /** Record video on failure */
    video: 'retain-on-failure',
  },

  /* Output Directory Structure */
  /** Directory for test artifacts (screenshots, videos, traces) */
  outputDir: 'test-results/artifacts',

  /* Configure Projects for Major Browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers (commented out - uncomment if needed) */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Local Development Server Configuration */
  webServer: {
    /** Command to start the development server
     * Uses zsh which sources ~/.zshenv where bun PATH is configured
     */
    command: process.platform === 'win32'
      ? 'bun run dev'
      : `zsh -c 'bun run dev'`,
    /** URL to check if server is ready */
    url: BASE_URL,
    /** Reuse existing server if available (not on CI) */
    reuseExistingServer: !IS_CI,
    /** Maximum time to wait for server to start */
    timeout: 120 * 1000,
  },
});
