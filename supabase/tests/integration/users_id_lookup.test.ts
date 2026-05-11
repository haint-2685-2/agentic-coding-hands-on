import { assertEquals } from '../_shared/deps.ts';
import { callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';

Deno.test('users-id: active user returns 200 with minimal fields', async () => {
  await truncateAppUserAndAuthUsers();
  const caller = await createTestUser();
  const target = await createTestUser({ email: `t-${Date.now()}@sun-asterisk.com`, fullName: 'Target' });
  const jwt = await signTokenForUser(caller.authUserId, { email: caller.email });
  const r = await callFn(`/users-id?id=${target.appUserId}`, { jwt });
  assertEquals(r.status, 200);
  assertEquals((r.body as { id: string; full_name: string }).full_name, 'Target');
});

Deno.test('users-id: inactive user → 404 (no existence leak)', async () => {
  await truncateAppUserAndAuthUsers();
  const caller = await createTestUser();
  const target = await createTestUser({ email: `t-${Date.now()}@sun-asterisk.com`, isActive: false });
  const jwt = await signTokenForUser(caller.authUserId, { email: caller.email });
  const r = await callFn(`/users-id?id=${target.appUserId}`, { jwt });
  assertEquals(r.status, 404);
});

Deno.test('users-id: missing id → 400', async () => {
  await truncateAppUserAndAuthUsers();
  const caller = await createTestUser();
  const jwt = await signTokenForUser(caller.authUserId, { email: caller.email });
  const r = await callFn('/users-id', { jwt });
  assertEquals(r.status, 400);
});
