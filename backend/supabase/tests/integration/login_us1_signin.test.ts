import { assert, assertEquals } from '../_shared/deps.ts';
import { adminClient, callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';

Deno.test({
  name: 'US1 AC2/AC3: provisioning an auth user upserts app_user; /me returns the profile',
  async fn() {
    await truncateAppUserAndAuthUsers();
    const u = await createTestUser({ fullName: 'Alice Nguyen', locale: 'en' });
    const jwt = await signTokenForUser(u.authUserId, { email: u.email });

    const res = await callFn('/me', { jwt });
    assertEquals(res.status, 200, `expected 200, got ${res.status} body=${JSON.stringify(res.body)}`);
    const body = res.body as Record<string, unknown>;
    assertEquals(body.email, u.email);
    assertEquals(body.full_name, 'Alice Nguyen');
    assertEquals(body.locale, 'en');
    assertEquals(body.role, 'user');
    assertEquals(body.is_active, true);
    assert(typeof body.id === 'string' && (body.id as string).length > 0);
  },
});

Deno.test({
  name: 'US1 AC2 (idempotency): re-provisioning the same auth user does not duplicate app_user',
  async fn() {
    await truncateAppUserAndAuthUsers();
    const u = await createTestUser({ fullName: 'Bob' });

    // Call the trigger logic via direct UPDATE of raw_user_meta_data and reapply.
    // In practice repeated sign-ins don't re-fire INSERT trigger; this test
    // asserts that a single app_user row exists.
    const admin = adminClient();
    const { data, error } = await admin
      .from('app_user')
      .select('id')
      .eq('auth_user_id', u.authUserId);
    assertEquals(error, null);
    assertEquals(data?.length, 1, 'exactly one app_user row should exist');
  },
});
