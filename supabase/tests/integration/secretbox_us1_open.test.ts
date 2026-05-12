import { assert, assertEquals } from '../_shared/deps.ts';
import { adminClient, callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';

async function grantBoxes(appUserId: string, n: number) {
  const admin = adminClient();
  const rows = Array.from({ length: n }, () => ({ user_id: appUserId, granted_reason: 'test' }));
  const { error } = await admin.from('secret_box').insert(rows);
  if (error) throw new Error(error.message);
}

Deno.test('US1 AC1: opening returns a badge + decrements unopened_count', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  await grantBoxes(u.appUserId, 3);
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/me-secret-boxes?action=open', { method: 'POST', jwt, body: {} });
  assertEquals(r.status, 200);
  const body = r.body as { badge: { code: string }; unopened_count: number };
  assert(typeof body.badge.code === 'string' && body.badge.code.length > 0);
  assertEquals(body.unopened_count, 2);
});

Deno.test('US1 AC2: no unopened boxes → 409 secret_box/no_boxes', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/me-secret-boxes?action=open', { method: 'POST', jwt, body: {} });
  assertEquals(r.status, 409);
  assertEquals((r.body as { error: { code: string } }).error.code, 'secret_box/no_boxes');
});

Deno.test('US1 AC3: unauth → 401', async () => {
  const r = await callFn('/me-secret-boxes?action=open', { method: 'POST', body: {} });
  assertEquals(r.status, 401);
});

Deno.test('US1 AC4: disabled user → 403', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser({ isActive: false });
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/me-secret-boxes?action=open', { method: 'POST', jwt, body: {} });
  assertEquals(r.status, 403);
});

Deno.test('US1 SC-004: unknown body keys → 422 validation/unknown_keys', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  await grantBoxes(u.appUserId, 1);
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/me-secret-boxes?action=open', { method: 'POST', jwt, body: { badge_code: 'hack' } });
  assertEquals(r.status, 422);
  assertEquals((r.body as { error: { code: string } }).error.code, 'validation/unknown_keys');
});
