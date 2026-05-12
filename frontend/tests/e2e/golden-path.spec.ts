import { test, expect } from './fixtures/auth';

const NEEDS_LIVE = !process.env.E2E_LIVE_SUPABASE;
const LIVE_REASON =
  'Cross-screen golden path needs authed session + seeded BE data. Run with E2E_LIVE_SUPABASE=1.';

test.describe('Cross-screen golden path', () => {
  test('login → home → kudos → viet-kudo modal → awards → secret-box', async ({ authed }) => {
    test.skip(NEEDS_LIVE, LIVE_REASON);

    // 1. Land on / (auth fixture already installed stub session).
    await authed.goto('/');
    await expect(authed).toHaveURL(/\/$|\/\?/);

    // 2. Click Sun*Kudos promo → /kudos.
    const kudosPromo = authed.getByRole('link', { name: /sun.?kudos|kudo/i }).first();
    await kudosPromo.click();
    await expect(authed).toHaveURL(/\/kudos(\?|$)/);

    // 3. Click "Viết Kudo" → modal opens.
    await authed.getByRole('link', { name: /viết kudo|new kudo|compose/i }).first().click();
    await expect(authed.getByRole('dialog')).toBeVisible();
    await expect(authed).toHaveURL(/\/kudos\/new/);

    // 4. Close modal via Escape (form is clean).
    await authed.keyboard.press('Escape');
    await expect(authed.getByRole('dialog')).toBeHidden();

    // 5. Navigate to /awards via header nav or direct link.
    await authed.goto('/awards#mvp');
    await expect(authed).toHaveURL(/\/awards#mvp/);

    // 6. Scroll into view and assert the MVP section visible.
    const mvp = authed.locator('#mvp').first();
    await mvp.scrollIntoViewIfNeeded();
    await expect(mvp).toBeVisible();

    // 7. Navigate to /secret-box.
    await authed.goto('/secret-box');
    await expect(authed.getByRole('main')).toBeVisible();
  });
});
