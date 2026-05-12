import { assertEquals } from '../_shared/deps.ts';
import { callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';

Deno.test({
  name: 'GET /me without Authorization → 401 auth/required',
  async fn() {
    const r = await callFn('/me');
    assertEquals(r.status, 401);
    assertEquals((r.body as { error: { code: string } }).error.code, 'auth/required');
  },
});

Deno.test({
  name: 'GET /me with malformed JWT → 401 auth/invalid-token',
  async fn() {
    const r = await callFn('/me', { jwt: 'not-a-real-token' });
    assertEquals(r.status, 401);
    const code = (r.body as { error: { code: string } }).error.code;
    // The Supabase client may return either auth/invalid-token or expired depending on parser path;
    // accept either of the two well-defined error codes from our handler.
    if (code !== 'auth/invalid-token' && code !== 'auth/expired') {
      throw new Error(`unexpected error code: ${code}`);
    }
  },
});

Deno.test({
  name: 'GET /me with valid JWT for disabled user → 403 auth/account-disabled',
  async fn() {
    await truncateAppUserAndAuthUsers();
    const u = await createTestUser({ isActive: false });
    const jwt = await signTokenForUser(u.authUserId, { email: u.email });
    const r = await callFn('/me', { jwt });
    assertEquals(r.status, 403);
    assertEquals((r.body as { error: { code: string } }).error.code, 'auth/account-disabled');
  },
});

Deno.test({
  name: 'GET /me with wrong method → 405',
  async fn() {
    await truncateAppUserAndAuthUsers();
    const u = await createTestUser();
    const jwt = await signTokenForUser(u.authUserId, { email: u.email });
    const r = await callFn('/me', { method: 'POST', jwt });
    assertEquals(r.status, 405);
  },
});
