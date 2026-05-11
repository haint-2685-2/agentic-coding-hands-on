import { assertEquals } from '../_shared/deps.ts';
import { callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';
import { createKudo, truncateKudoData } from '../_shared/kudo-fixtures.ts';

Deno.test('US5 AC1: spotlight aggregates by receiver, total_kudos correct', async () => {
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const a = await createTestUser({ fullName: 'A' });
  const b = await createTestUser({ email: `b-${Date.now()}@sun-asterisk.com`, fullName: 'B' });
  for (let i = 0; i < 3; i++) await createKudo(a.appUserId, b.appUserId);
  for (let i = 0; i < 2; i++) await createKudo(b.appUserId, a.appUserId);

  const jwt = await signTokenForUser(a.authUserId, { email: a.email });
  const r = await callFn('/kudos-spotlight', { jwt });
  assertEquals(r.status, 200);
  const body = r.body as { items: { user_id: string; count: number }[]; total_kudos: number };
  assertEquals(body.total_kudos, 5);
  const bItem = body.items.find((i) => i.user_id === b.appUserId);
  assertEquals(bItem?.count, 3);
});

Deno.test('US5 AC2: ?q filters by name (case-insensitive)', async () => {
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const sender = await createTestUser({ fullName: 'Sender' });
  const alice = await createTestUser({ email: `alice-${Date.now()}@sun-asterisk.com`, fullName: 'Alice Nguyen' });
  const bob = await createTestUser({ email: `bob-${Date.now()}@sun-asterisk.com`, fullName: 'Bob Tran' });
  await createKudo(sender.appUserId, alice.appUserId);
  await createKudo(sender.appUserId, bob.appUserId);

  const jwt = await signTokenForUser(sender.authUserId, { email: sender.email });
  const r = await callFn('/kudos-spotlight?q=alice', { jwt });
  const items = (r.body as { items: { full_name: string }[] }).items;
  for (const it of items) {
    if (!it.full_name.toLowerCase().includes('alice')) throw new Error(`unexpected ${it.full_name}`);
  }
});

Deno.test('US5 AC3: q length > 100 → 422', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn(`/kudos-spotlight?q=${'a'.repeat(101)}`, { jwt });
  assertEquals(r.status, 422);
});

Deno.test('US5 AC4: empty data returns total_kudos=0', async () => {
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/kudos-spotlight', { jwt });
  const body = r.body as { items: unknown[]; total_kudos: number };
  assertEquals(body.total_kudos, 0);
  assertEquals(body.items.length, 0);
});
