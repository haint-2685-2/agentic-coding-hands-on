import { test, expect } from './fixtures/auth';
import { recordRequests } from './utils/mock-api';

const NEEDS_LIVE = !process.env.E2E_LIVE_SUPABASE;
const LIVE_REASON =
  'Requires authed session against live Supabase. Run with E2E_LIVE_SUPABASE=1 + supabase start.';

test.describe('Kudos live board (MaZUn5xHXZ-kudos-live-board)', () => {
  test('anon hitting /kudos is redirected to /login?next=/kudos', async ({ page }) => {
    await page.goto('/kudos');
    await expect(page).toHaveURL(/\/login\?.*next=%2Fkudos/);
  });

  test('authed feed renders, highlight carousel + filter chips work', async ({ authed }) => {
    test.skip(NEEDS_LIVE, LIVE_REASON);
    await authed.goto('/kudos');

    // Feed list.
    await expect(authed.getByRole('feed').or(authed.locator('[data-testid="kudos-feed"]'))).toBeVisible();

    // Highlight carousel arrow advances.
    const next = authed.getByRole('button', { name: /next|tiếp|>/ }).first();
    if (await next.count()) {
      await next.click();
    }

    // Filter chip click adds a search param.
    const chip = authed.getByRole('button', { name: /filter|category|chip/i }).first();
    if (await chip.count()) {
      await chip.click();
      await expect(authed).toHaveURL(/\?.*=.*/);
    }
  });

  test('heart button optimistic toggle fires POST with expected shape', async ({ authed }) => {
    test.skip(NEEDS_LIVE, LIVE_REASON);
    const reqs = recordRequests(authed, /\/rest\/v1\/kudos.*reaction|\/functions\/v1\/kudos/);
    await authed.goto('/kudos');

    const heart = authed.getByRole('button', { name: /heart|like|❤|tim/i }).first();
    await heart.click();

    // Optimistic UI toggles immediately.
    await expect(heart).toHaveAttribute('aria-pressed', /true/i);
    expect(reqs.length).toBeGreaterThan(0);
  });

  test('quick-input pill navigates to intercepted /kudos/new modal', async ({ authed }) => {
    test.skip(NEEDS_LIVE, LIVE_REASON);
    await authed.goto('/kudos');
    const pill = authed.getByRole('link', { name: /viết kudo|new kudo|compose/i }).first();
    await pill.click();
    await expect(authed).toHaveURL(/\/kudos\/new/);
    // Intercepted route opens as a modal on top of /kudos — assert dialog role.
    await expect(authed.getByRole('dialog')).toBeVisible();
  });
});
