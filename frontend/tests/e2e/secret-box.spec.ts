import { test, expect } from './fixtures/auth';
import { mockRoutes } from './utils/mock-api';

const NEEDS_LIVE = !process.env.E2E_LIVE_SUPABASE;
const LIVE_REASON =
  'Requires authed session against live Supabase. Run with E2E_LIVE_SUPABASE=1 + supabase start.';

test.describe('Open Secret Box (J3-4YFIpMM-open-secret-box)', () => {
  test('anon hitting /secret-box is redirected to /login?next=/secret-box', async ({ page }) => {
    await page.goto('/secret-box');
    await expect(page).toHaveURL(/\/login\?.*next=%2Fsecret-box/);
  });

  test('authed with boxes available: CTA enabled → reveal modal shows badge', async ({ authed }) => {
    test.skip(NEEDS_LIVE, LIVE_REASON);
    await authed.goto('/secret-box');

    const cta = authed.getByRole('button', { name: /open|mở/i }).first();
    await expect(cta).toBeEnabled();
    await cta.click();

    // Loading then reveal.
    const modal = authed.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.locator('img')).toBeVisible();
  });

  test('authed with 0 boxes: empty state shown, CTA disabled', async ({ authed }) => {
    test.skip(NEEDS_LIVE, LIVE_REASON);
    // Stub the boxes-remaining endpoint to 0.
    await mockRoutes(authed, [
      { match: /\/functions\/v1\/secret-box.*remaining/, body: { remaining: 0 } },
    ]);
    await authed.goto('/secret-box');

    await expect(authed.getByText(/no boxes|hết hộp|empty/i)).toBeVisible();
    await expect(authed.getByRole('button', { name: /open|mở/i }).first()).toBeDisabled();
  });

  test('429 response surfaces toast with retry timer', async ({ authed }) => {
    test.skip(NEEDS_LIVE, LIVE_REASON);
    await mockRoutes(authed, [
      {
        match: /\/functions\/v1\/secret-box.*open/,
        status: 429,
        body: { error: 'rate_limited', retry_after: 30 },
        headers: { 'Retry-After': '30' },
      },
    ]);
    await authed.goto('/secret-box');
    await authed.getByRole('button', { name: /open|mở/i }).first().click();

    await expect(authed.getByRole('status').or(authed.locator('[role="alert"]'))).toContainText(
      /retry|thử lại|\d+s/i,
    );
  });

  test('Modal Escape closes and returns focus to trigger', async ({ authed }) => {
    test.skip(NEEDS_LIVE, LIVE_REASON);
    await authed.goto('/secret-box');
    const cta = authed.getByRole('button', { name: /open|mở/i }).first();
    await cta.click();
    await expect(authed.getByRole('dialog')).toBeVisible();

    await authed.keyboard.press('Escape');
    await expect(authed.getByRole('dialog')).toBeHidden();
    await expect(cta).toBeFocused();
  });
});
