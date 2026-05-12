import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for SAA 2025 frontend.
 *
 * The webServer block auto-spawns `pnpm dev` (Next.js) against
 * http://localhost:3000. The Next app in turn talks to the local Supabase
 * stack at http://127.0.0.1:54321 — that stack is NOT managed by Playwright.
 * Run `supabase start` + `supabase functions serve` in `backend/` before
 * `pnpm e2e` for non-mocked tests to pass.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /\.mobile\.spec\.ts$/,
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
      testMatch: /\.mobile\.spec\.ts$/,
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
