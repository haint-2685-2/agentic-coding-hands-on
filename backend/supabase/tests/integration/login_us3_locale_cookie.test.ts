import { assertEquals } from '../_shared/deps.ts';
import { adminClient, callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';

Deno.test({
  name: 'US3 AC1: cookie_locale=en at sign-up persists to app_user.locale',
  async fn() {
    await truncateAppUserAndAuthUsers();
    const u = await createTestUser({ locale: 'en' });
    const admin = adminClient();
    const { data } = await admin.from('app_user').select('locale').eq('id', u.appUserId).single();
    assertEquals(data?.locale, 'en');
  },
});

Deno.test({
  name: 'US3 AC2: explicit invalid locale falls back to vi',
  async fn() {
    await truncateAppUserAndAuthUsers();
    // createTestUser only allows the enum; for this AC we provision via admin
    // with a junk cookie_locale to verify the trigger fallback.
    const admin = adminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email: `junk-locale-${Date.now()}@sun-asterisk.com`,
      email_confirm: true,
      user_metadata: { full_name: 'Junk', cookie_locale: 'pirate', email_verified: true },
    });
    if (error) throw new Error(error.message);
    const { data: row } = await admin
      .from('app_user')
      .select('locale')
      .eq('auth_user_id', data.user!.id)
      .single();
    assertEquals(row?.locale, 'vi');
  },
});

Deno.test({
  name: 'US3 AC3: PATCH /me/language updates locale; invalid value rejected',
  async fn() {
    await truncateAppUserAndAuthUsers();
    const u = await createTestUser({ locale: 'vi' });
    const jwt = await signTokenForUser(u.authUserId, { email: u.email });

    // happy path
    const ok = await callFn('/me-language', { method: 'PATCH', jwt, body: { locale: 'ja' } });
    assertEquals(ok.status, 200);
    assertEquals((ok.body as Record<string, unknown>).locale, 'ja');

    // verify persistence
    const me = await callFn('/me', { jwt });
    assertEquals((me.body as Record<string, unknown>).locale, 'ja');

    // invalid enum
    const bad = await callFn('/me-language', { method: 'PATCH', jwt, body: { locale: 'zh' } });
    assertEquals(bad.status, 422);
    assertEquals(((bad.body as { error: { code: string } }).error.code), 'validation/locale');
  },
});
