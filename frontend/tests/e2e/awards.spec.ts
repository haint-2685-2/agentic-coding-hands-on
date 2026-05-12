import { test, expect } from './fixtures/auth';
import { setLocaleCookie } from './utils/locale';

const NEEDS_LIVE = !process.env.E2E_LIVE_SUPABASE;
const LIVE_REASON =
  'Requires authed session against live Supabase. Run with E2E_LIVE_SUPABASE=1 + supabase start.';

const VND_RE = /\d{1,3}(\.\d{3})+\s?₫|\d+\s?VND/;

test.describe('Hệ thống giải (zFYDgyj_pD-he-thong-giai)', () => {
  test('anon hitting /awards is redirected to /login?next=/awards', async ({ page }) => {
    await page.goto('/awards');
    await expect(page).toHaveURL(/\/login\?.*next=%2Fawards/);
  });

  test('authed: 6 sections render with VND prize money', async ({ authed }) => {
    test.skip(NEEDS_LIVE, LIVE_REASON);
    await authed.goto('/awards');

    // 6 award category sections.
    const sections = authed.getByRole('region');
    expect(await sections.count()).toBeGreaterThanOrEqual(6);

    // At least one VND-formatted prize string.
    await expect(authed.getByText(VND_RE).first()).toBeVisible();
  });

  test('left rail click jumps to section and updates URL hash', async ({ authed }) => {
    test.skip(NEEDS_LIVE, LIVE_REASON);
    await authed.goto('/awards');
    const railLink = authed.locator('nav a[href^="#"]').first();
    const href = await railLink.getAttribute('href');
    await railLink.click();
    await expect(authed).toHaveURL(new RegExp(`${href}$`));
  });

  test('scroll-spy updates aria-current on rail link', async ({ authed }) => {
    test.skip(NEEDS_LIVE, LIVE_REASON);
    await authed.goto('/awards');

    // Scroll to bottom of main content.
    await authed.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await authed.waitForTimeout(400);

    const current = authed.locator('nav a[aria-current="true"], nav a[aria-current="location"]');
    await expect(current.first()).toBeVisible();
  });

  test('VND format stays vi-VN after switching to EN locale', async ({ authed, context }) => {
    test.skip(NEEDS_LIVE, LIVE_REASON);
    await setLocaleCookie(context, 'en');
    await authed.goto('/awards');
    // Prize money must remain in vi-VN regardless of UI language.
    await expect(authed.getByText(VND_RE).first()).toBeVisible();
  });
});
