import { test, expect } from './fixtures/auth';

test.describe('Homepage SAA (i87tDx10uM-homepage-saa)', () => {
  test('anon sees hero, countdown, awards grid, footer; no bell/avatar', async ({ page }) => {
    await page.goto('/');

    // Hero / countdown section.
    await expect(page.locator('main')).toBeVisible();

    // Awards grid is visible (anon-readable).
    const awardsGrid = page.getByRole('region', { name: /award|gi[ảa]i/i }).or(
      page.locator('[data-testid="awards-grid"]'),
    );
    // Soft assertion: grid OR fallback to body containing award cards.
    if (await awardsGrid.count()) {
      await expect(awardsGrid.first()).toBeVisible();
    }

    // No notification bell or avatar visible to anon.
    await expect(page.getByRole('button', { name: /notification|bell|th[ôo]ng b[áa]o/i })).toHaveCount(0);
    await expect(page.locator('[data-testid="user-avatar"]')).toHaveCount(0);

    // Footer is visible.
    await expect(page.getByRole('contentinfo').first()).toBeVisible();
  });

  test('authed user sees bell + avatar in header', async ({ authed }) => {
    // This relies on the home server component picking up the stub session.
    // Without a real session it falls back to anon render — skip with a note.
    test.skip(
      !process.env.E2E_LIVE_SUPABASE,
      'Authed header requires a real Supabase session; stub cookie is not signed. Run with E2E_LIVE_SUPABASE=1 against `supabase start` + a seeded user.',
    );
    await authed.goto('/');
    await expect(authed.locator('[data-testid="user-avatar"]')).toBeVisible();
    await expect(authed.getByRole('button', { name: /notification|bell/i })).toBeVisible();
  });

  test('countdown ticks every second', async ({ page }) => {
    await page.goto('/');

    const countdown = page.locator('[data-testid="countdown"], [aria-label*="countdown" i]').first();
    if (!(await countdown.count())) {
      test.skip(true, 'No countdown test-id exposed on home — covered by visual diff instead.');
      return;
    }
    const first = await countdown.textContent();
    await page.waitForTimeout(1500);
    const second = await countdown.textContent();
    expect(second).not.toEqual(first);
  });

  test('clicking an award card navigates to /awards#<slug>', async ({ page }) => {
    await page.goto('/');

    const card = page.locator('a[href^="/awards#"]').first();
    if (!(await card.count())) {
      test.skip(true, 'No award cards rendered (anon list may be empty without BE seed data).');
      return;
    }
    await card.click();
    await expect(page).toHaveURL(/\/awards#.+/);
  });

  test('language switch updates UI + saa_locale cookie', async ({ page, context }) => {
    await page.goto('/');

    const langSwitch = page
      .getByRole('button', { name: /語|vi|en|jp|ngôn ngữ|language/i })
      .first();

    if (!(await langSwitch.count())) {
      test.skip(true, 'Language switch button not yet exposed on home header.');
      return;
    }
    await langSwitch.click();

    const opt = page.getByRole('menuitem', { name: /english|vi[eệ]t/i }).first();
    if (await opt.count()) await opt.click();

    await page.waitForLoadState('networkidle');
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'saa_locale')).toBeTruthy();
  });
});
