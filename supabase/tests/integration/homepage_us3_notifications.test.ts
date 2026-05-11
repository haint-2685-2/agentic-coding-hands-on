import { assertEquals } from '../_shared/deps.ts';
import {
  adminClient,
  callFn,
  createTestUser,
  signTokenForUser,
  truncateAppUserAndAuthUsers,
} from '../_shared/supa.ts';

async function seedNotifications(userId: string, count: number, opts: { unread?: number } = {}) {
  const admin = adminClient();
  const unread = opts.unread ?? count;
  const rows = Array.from({ length: count }).map((_, i) => ({
    user_id: userId,
    type: 'kudo.received',
    title: `Notification ${i + 1}`,
    body: `Body ${i + 1}`,
    read_at: i < unread ? null : new Date().toISOString(),
  }));
  const { error } = await admin.from('notification').insert(rows);
  if (error) throw new Error(error.message);
}

Deno.test('US3 AC1: unread-count returns correct number', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  await seedNotifications(u.appUserId, 5, { unread: 3 });
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/me-notifications?count=true', { jwt });
  assertEquals(r.status, 200);
  assertEquals((r.body as { unread_count: number }).unread_count, 3);
});

Deno.test('US3 AC2: list returns items ordered DESC with next_cursor', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  await seedNotifications(u.appUserId, 25, { unread: 25 });
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/me-notifications?limit=10', { jwt });
  assertEquals(r.status, 200);
  const body = r.body as { items: unknown[]; next_cursor: string | null };
  assertEquals(body.items.length, 10);
  if (body.next_cursor === null) throw new Error('expected next_cursor');
});

Deno.test('US3 AC3: PATCH /me-notifications-id marks one read; foreign id → 404', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const other = await createTestUser({ email: `other-${Date.now()}@sun-asterisk.com` });
  await seedNotifications(u.appUserId, 1, { unread: 1 });
  await seedNotifications(other.appUserId, 1, { unread: 1 });
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });

  // get own notification id
  const list = await callFn('/me-notifications', { jwt });
  const items = (list.body as { items: { id: string }[] }).items;
  const myId = items[0].id;

  // mark mine
  const ok = await callFn(`/me-notifications-id?id=${myId}`, {
    method: 'PATCH', jwt, body: { read: true },
  });
  assertEquals(ok.status, 200);

  // try to mark other's
  const adminCli = adminClient();
  const { data } = await adminCli.from('notification').select('id').eq('user_id', other.appUserId).single();
  const otherId = (data as { id: string }).id;
  const denied = await callFn(`/me-notifications-id?id=${otherId}`, {
    method: 'PATCH', jwt, body: { read: true },
  });
  assertEquals(denied.status, 404);
  assertEquals((denied.body as { error: { code: string } }).error.code, 'notification/not_found');
});

Deno.test('US3 AC4: POST mark-all-read returns count', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  await seedNotifications(u.appUserId, 4, { unread: 4 });
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });

  const r = await callFn('/me-notifications?action=mark-all-read', { method: 'POST', jwt });
  assertEquals(r.status, 200);
  assertEquals((r.body as { updated: number }).updated, 4);

  // verify unread now 0
  const after = await callFn('/me-notifications?count=true', { jwt });
  assertEquals((after.body as { unread_count: number }).unread_count, 0);
});

Deno.test('US3 AC5: unauth → 401 on /me-notifications*', async () => {
  const r = await callFn('/me-notifications?count=true');
  assertEquals(r.status, 401);
});

Deno.test('US3 AC6: disabled user → 403', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser({ isActive: false });
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/me-notifications?count=true', { jwt });
  assertEquals(r.status, 403);
});

Deno.test('US3 cross-user LEAK: user A cannot see B\'s notifications', async () => {
  await truncateAppUserAndAuthUsers();
  const a = await createTestUser();
  const b = await createTestUser({ email: `bother-${Date.now()}@sun-asterisk.com` });
  await seedNotifications(b.appUserId, 5, { unread: 5 });
  const jwt = await signTokenForUser(a.authUserId, { email: a.email });
  const r = await callFn('/me-notifications', { jwt });
  const items = (r.body as { items: unknown[] }).items;
  assertEquals(items.length, 0, 'user A should see zero of B\'s notifications');
});
