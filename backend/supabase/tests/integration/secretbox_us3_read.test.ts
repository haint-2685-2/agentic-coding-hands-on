import { assertEquals } from '../_shared/deps.ts';
import { adminClient, callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';

async function grantBoxes(appUserId: string, n: number) {
  const admin = adminClient();
  const rows = Array.from({ length: n }, () => ({ user_id: appUserId, granted_reason: 'test' }));
  const { error } = await admin.from('secret_box').insert(rows);
  if (error) throw new Error(error.message);
}

Deno.test('US3 AC1: GET /me-secret-boxes returns counters', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  await grantBoxes(u.appUserId, 3);
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/me-secret-boxes', { jwt });
  assertEquals(r.status, 200);
  const body = r.body as { unopened_count: number; opened_count: number; opened: unknown[] };
  assertEquals(body.unopened_count, 3);
  assertEquals(body.opened_count, 0);
  assertEquals(body.opened.length, 0);
});

Deno.test('US3 AC2: empty state → 0/0/[]', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/me-secret-boxes', { jwt });
  const body = r.body as { unopened_count: number; opened_count: number; opened: unknown[] };
  assertEquals(body.unopened_count, 0);
  assertEquals(body.opened_count, 0);
});

Deno.test('US3 AC3: post-open, GET reflects new state', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  await grantBoxes(u.appUserId, 2);
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });

  await callFn('/me-secret-boxes?action=open', { method: 'POST', jwt, body: {} });
  const r = await callFn('/me-secret-boxes', { jwt });
  const body = r.body as { unopened_count: number; opened_count: number; opened: { badge_code: string }[] };
  assertEquals(body.unopened_count, 1);
  assertEquals(body.opened_count, 1);
  assertEquals(body.opened.length, 1);
});
