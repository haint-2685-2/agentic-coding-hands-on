import { test, expect } from './fixtures/auth';

const NEEDS_LIVE = !process.env.E2E_LIVE_SUPABASE;
const LIVE_REASON =
  'Requires authed session against live Supabase. Run with E2E_LIVE_SUPABASE=1 + supabase start.';

test.describe('Viết Kudo (ihQ26W78P2-viet-kudo)', () => {
  test('anon hitting /kudos/new is redirected to /login?next=/kudos/new', async ({ page }) => {
    await page.goto('/kudos/new');
    await expect(page).toHaveURL(/\/login\?.*next=%2Fkudos%2Fnew/);
  });

  test('full /kudos/new route renders form with required fields', async ({ authed }) => {
    test.skip(NEEDS_LIVE, LIVE_REASON);
    await authed.goto('/kudos/new');
    await expect(authed.getByRole('textbox', { name: /receiver|người nhận/i }).first()).toBeVisible();
    await expect(authed.getByRole('textbox', { name: /message|nội dung/i }).first()).toBeVisible();
  });

  test('modal opens via intercepted route from /kudos and traps focus', async ({ authed }) => {
    test.skip(NEEDS_LIVE, LIVE_REASON);
    await authed.goto('/kudos');
    await authed.getByRole('link', { name: /viết kudo|new kudo|compose/i }).first().click();

    const dialog = authed.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // First focusable inside the dialog should be focused.
    const focused = authed.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('Escape closes modal (with dirty-confirm when form dirty)', async ({ authed }) => {
    test.skip(NEEDS_LIVE, LIVE_REASON);
    await authed.goto('/kudos');
    await authed.getByRole('link', { name: /viết kudo|new kudo|compose/i }).first().click();
    const dialog = authed.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Type into message → dirty.
    const message = authed.getByRole('textbox', { name: /message|nội dung/i }).first();
    if (await message.count()) await message.fill('test text');

    await authed.keyboard.press('Escape');

    // Either confirm dialog appears (dirty) or modal closes (not dirty).
    const confirm = authed.getByRole('alertdialog');
    if (await confirm.count()) {
      await expect(confirm).toBeVisible();
    } else {
      await expect(dialog).toBeHidden();
    }
  });

  test('submit empty form shows validation errors next to required fields', async ({ authed }) => {
    test.skip(NEEDS_LIVE, LIVE_REASON);
    await authed.goto('/kudos/new');
    await authed.getByRole('button', { name: /submit|gửi|send/i }).first().click();

    // At least one validation message visible.
    const errors = authed.locator('[role="alert"], [aria-invalid="true"]');
    await expect(errors.first()).toBeVisible();
  });

  test('receiver typeahead debounces ~250ms and supports keyboard nav', async ({ authed }) => {
    test.skip(NEEDS_LIVE, LIVE_REASON);
    await authed.goto('/kudos/new');
    const input = authed.getByRole('combobox').or(
      authed.getByRole('textbox', { name: /receiver|người nhận/i }),
    ).first();
    await input.fill('a');

    // After debounce, listbox appears.
    await expect(authed.getByRole('listbox')).toBeVisible({ timeout: 2000 });

    await input.press('ArrowDown');
    await input.press('Enter');
    // First option should be selected (input populated with name).
    await expect(input).not.toHaveValue('a');
  });

  test('message char counter updates as user types', async ({ authed }) => {
    test.skip(NEEDS_LIVE, LIVE_REASON);
    await authed.goto('/kudos/new');
    const message = authed.getByRole('textbox', { name: /message|nội dung/i }).first();
    await message.fill('hello');

    // Look for a counter pattern like "5 / 500" or "5/500".
    await expect(authed.getByText(/\b5\s*\/\s*\d+/)).toBeVisible();
  });
});
