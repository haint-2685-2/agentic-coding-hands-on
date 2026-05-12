import { assertEquals } from '../_shared/deps.ts';
import { callFn, createTestUser, signTokenForUser, truncateAppUserAndAuthUsers } from '../_shared/supa.ts';
import { createKudo, truncateKudoData } from '../_shared/kudo-fixtures.ts';

Deno.test('US1 AC1: feed returns paginated items DESC by created_at', async () => {
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const a = await createTestUser({ fullName: 'Alice' });
  const b = await createTestUser({ email: `bob-${Date.now()}@sun-asterisk.com`, fullName: 'Bob' });
  for (let i = 0; i < 3; i++) {
    await createKudo(a.appUserId, b.appUserId, { message: `K${i}`, hashtags: ['dedicated'] });
  }
  const jwt = await signTokenForUser(b.authUserId, { email: b.email });
  const r = await callFn('/kudos?limit=10', { jwt });
  assertEquals(r.status, 200);
  const body = r.body as { items: { id: string; message: string }[]; next_cursor: string | null };
  assertEquals(body.items.length, 3);
});

Deno.test('US1 AC2: empty feed returns items=[] next_cursor=null', async () => {
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/kudos', { jwt });
  assertEquals(r.status, 200);
  const body = r.body as { items: unknown[]; next_cursor: string | null };
  assertEquals(body.items.length, 0);
  assertEquals(body.next_cursor, null);
});

Deno.test('US1 AC3: unauth → 401', async () => {
  const r = await callFn('/kudos');
  assertEquals(r.status, 401);
});

Deno.test('US1 AC4: limit > 100 → 422', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/kudos?limit=999', { jwt });
  assertEquals(r.status, 422);
});

Deno.test('US1 AC5: bad cursor → 422', async () => {
  await truncateAppUserAndAuthUsers();
  const u = await createTestUser();
  const jwt = await signTokenForUser(u.authUserId, { email: u.email });
  const r = await callFn('/kudos?before=not-a-date', { jwt });
  assertEquals(r.status, 422);
});

Deno.test('US1 AC6: items include viewer flags + anonymous mask', async () => {
  await truncateKudoData();
  await truncateAppUserAndAuthUsers();
  const a = await createTestUser({ fullName: 'Sender' });
  const b = await createTestUser({ email: `b-${Date.now()}@sun-asterisk.com`, fullName: 'Receiver' });
  const anonKudoId = await createKudo(a.appUserId, b.appUserId, { message: 'secret', is_anonymous: true });
  const jwt = await signTokenForUser(b.authUserId, { email: b.email });
  const r = await callFn('/kudos', { jwt });
  const item = (r.body as { items: { id: string; is_anonymous: boolean; sender: { full_name: string }; viewer_has_liked: boolean; viewer_is_sender: boolean }[] }).items.find((i) => i.id === anonKudoId);
  if (!item) throw new Error('kudo missing');
  assertEquals(item.is_anonymous, true);
  assertEquals(item.sender.full_name, 'Ẩn danh');
  assertEquals(item.viewer_has_liked, false);
  assertEquals(item.viewer_is_sender, false);
});
