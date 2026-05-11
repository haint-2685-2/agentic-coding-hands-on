import { assertEquals } from '../_shared/deps.ts';
import { callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';
import { truncateKudoData } from '../_shared/kudo-fixtures.ts';
import { _reset as resetDedup } from '../../functions/_shared/dedup.ts';

async function postKudo(jwt: string, body: Record<string, unknown>) {
  return callFn('/kudos-create', { method: 'POST', jwt, body });
}

Deno.test('US3 AC1: missing receiver_id → 422 validation/required', async () => {
  resetDedup();
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await postKudo(jwt, { message: 'hi', hashtags: ['t'] });
  assertEquals(r.status, 422);
  assertEquals((r.body as { error: { code: string } }).error.code, 'validation/required');
});

Deno.test('US3 AC2: empty message → 422', async () => {
  resetDedup();
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const sender = await createTestUser();
  const recv = await createTestUser({ email: `r-${Date.now()}@sun-asterisk.com` });
  const jwt = await signTokenForUser(sender.authUserId, { email: sender.email });
  const r = await postKudo(jwt, { receiver_id: recv.appUserId, message: '', hashtags: ['t'] });
  assertEquals(r.status, 422);
});

Deno.test('US3 AC3: empty hashtags → 422', async () => {
  resetDedup();
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const sender = await createTestUser();
  const recv = await createTestUser({ email: `r-${Date.now()}@sun-asterisk.com` });
  const jwt = await signTokenForUser(sender.authUserId, { email: sender.email });
  const r = await postKudo(jwt, { receiver_id: recv.appUserId, message: 'hi', hashtags: [] });
  assertEquals(r.status, 422);
});

Deno.test('US3 AC4: > 5 hashtags → 422 validation/hashtags_max', async () => {
  resetDedup();
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const sender = await createTestUser();
  const recv = await createTestUser({ email: `r-${Date.now()}@sun-asterisk.com` });
  const jwt = await signTokenForUser(sender.authUserId, { email: sender.email });
  const r = await postKudo(jwt, { receiver_id: recv.appUserId, message: 'hi', hashtags: ['a', 'b', 'c', 'd', 'e', 'f'] });
  assertEquals(r.status, 422);
  assertEquals((r.body as { error: { code: string } }).error.code, 'validation/hashtags_max');
});

Deno.test('US3 AC5: message > 1000 chars → 422', async () => {
  resetDedup();
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const sender = await createTestUser();
  const recv = await createTestUser({ email: `r-${Date.now()}@sun-asterisk.com` });
  const jwt = await signTokenForUser(sender.authUserId, { email: sender.email });
  const r = await postKudo(jwt, { receiver_id: recv.appUserId, message: 'a'.repeat(1001), hashtags: ['t'] });
  assertEquals(r.status, 422);
  assertEquals((r.body as { error: { code: string } }).error.code, 'validation/message_max');
});

Deno.test('US3 AC6: self-receiver → 422 kudo/self_receiver', async () => {
  resetDedup();
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await postKudo(jwt, { receiver_id: u.appUserId, message: 'self', hashtags: ['t'] });
  assertEquals(r.status, 422);
  assertEquals((r.body as { error: { code: string } }).error.code, 'kudo/self_receiver');
});

Deno.test('US3 AC7: receiver not found → 404 user/not_found', async () => {
  resetDedup();
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const sender = await createTestUser();
  const jwt = await signTokenForUser(sender.authUserId, { email: sender.email });
  const r = await postKudo(jwt, { receiver_id: '00000000-0000-0000-0000-000000000000', message: 'x', hashtags: ['t'] });
  assertEquals(r.status, 404);
});

Deno.test('US3 unknown key → 422 validation/unknown_keys', async () => {
  resetDedup();
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const sender = await createTestUser();
  const recv = await createTestUser({ email: `r-${Date.now()}@sun-asterisk.com` });
  const jwt = await signTokenForUser(sender.authUserId, { email: sender.email });
  const r = await postKudo(jwt, { receiver_id: recv.appUserId, message: 'hi', hashtags: ['t'], extra: 'tamper' });
  assertEquals(r.status, 422);
  assertEquals((r.body as { error: { code: string } }).error.code, 'validation/unknown_keys');
});
