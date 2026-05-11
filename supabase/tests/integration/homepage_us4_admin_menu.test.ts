import { assertEquals } from '../_shared/deps.ts';
import { callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';

Deno.test('US4 AC1: admin user → /me.role = "admin"', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser({ role: 'admin' });
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/me', { jwt });
  assertEquals(r.status, 200);
  assertEquals((r.body as { role: string }).role, 'admin');
});

Deno.test('US4 AC2: regular user → /me.role = "user"', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/me', { jwt });
  assertEquals((r.body as { role: string }).role, 'user');
});
