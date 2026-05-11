import { assertEquals } from '../_shared/deps.ts';
import { callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';
import { createKudo, truncateKudoData } from '../_shared/kudo-fixtures.ts';

Deno.test('US6 AC1: like increments count; idempotent on repeat', async () => {
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const a = await createTestUser();
  const b = await createTestUser({ email: `b-${Date.now()}@sun-asterisk.com` });
  const k = await createKudo(a.appUserId, b.appUserId);
  const jwt = await signTokenForUser(b.authUserId, { email: b.email });

  const r1 = await callFn(`/kudos-like?id=${k}`, { method: 'POST', jwt });
  assertEquals(r1.status, 200);
  const body1 = r1.body as { liked: boolean; like_count: number; hearts_added: number };
  assertEquals(body1.liked, true);
  assertEquals(body1.like_count, 1);
  assertEquals(body1.hearts_added, 1);

  // idempotent
  const r2 = await callFn(`/kudos-like?id=${k}`, { method: 'POST', jwt });
  const body2 = r2.body as { hearts_added: number; like_count: number };
  assertEquals(body2.hearts_added, 0);
  assertEquals(body2.like_count, 1);
});

Deno.test('US6 AC2: sender cannot like own kudo → 403 kudo/cannot_like_own', async () => {
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const a = await createTestUser();
  const b = await createTestUser({ email: `b-${Date.now()}@sun-asterisk.com` });
  const k = await createKudo(a.appUserId, b.appUserId);
  const jwt = await signTokenForUser(a.authUserId, { email: a.email });
  const r = await callFn(`/kudos-like?id=${k}`, { method: 'POST', jwt });
  assertEquals(r.status, 403);
  assertEquals((r.body as { error: { code: string } }).error.code, 'kudo/cannot_like_own');
});

Deno.test('US6 AC3: DELETE unlike', async () => {
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const a = await createTestUser();
  const b = await createTestUser({ email: `b-${Date.now()}@sun-asterisk.com` });
  const k = await createKudo(a.appUserId, b.appUserId);
  const jwt = await signTokenForUser(b.authUserId, { email: b.email });

  await callFn(`/kudos-like?id=${k}`, { method: 'POST', jwt });
  const r = await callFn(`/kudos-like?id=${k}`, { method: 'DELETE', jwt });
  assertEquals(r.status, 200);
  assertEquals((r.body as { liked: boolean; like_count: number }).like_count, 0);
});

Deno.test('US6 AC5: liking non-existent kudo → 404', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/kudos-like?id=00000000-0000-0000-0000-000000000000', { method: 'POST', jwt });
  assertEquals(r.status, 404);
});

Deno.test('US6 AC6: unauth → 401', async () => {
  const r = await callFn('/kudos-like?id=any', { method: 'POST' });
  assertEquals(r.status, 401);
});
