import { defineConfig, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:4200';
const isCI = !!process.env['CI'];

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',

  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,

  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // `npm start` builds the library into dist/ before serving.
  //
  // `reuseExistingServer` is deliberately false, including locally. The demo
  // imports the library from dist/ through a tsconfig path mapping, and
  // `ng serve` does not watch dist/ — so reusing a server that was started
  // before the last library change silently tests stale CSS and stale code.
  // The extra ~15s of startup is worth not getting a false green.
  webServer: {
    command: 'npm start',
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
