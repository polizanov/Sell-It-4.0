import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'phase1-empty-state',
      testDir: './tests/e2e/phase1-empty-state',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'phase2-setup',
      testDir: './tests/e2e/phase2-setup',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['phase1-empty-state'],
    },
    {
      name: 'phase3-with-data',
      testDir: './tests/e2e/phase3-with-data',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['phase2-setup'],
    },
  ],
  webServer: [
    {
      command: 'NODE_ENV=test MONGODB_URI=mongodb://localhost:27017/sellit40_test npm run dev -w backend',
      url: 'http://localhost:5005/api/health',
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
    {
      command: 'npm run dev -w frontend',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
  ],
});
